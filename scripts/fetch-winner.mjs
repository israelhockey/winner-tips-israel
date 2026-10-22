// Winner's odds, from the public line its own website reads (no login involved).
// Saves only the leagues and markets we price to data/raw/winner.json. If Winner can't be
// reached, the previous file is kept and the site shows those odds with their age.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseLine } from "./winner-match.mjs";

const OUT = new URL("../data/raw/winner.json", import.meta.url);
const STATUS = new URL("../data/raw/winner-status.json", import.meta.url);
// What happened on the last try, kept in the repo so a blocked fetch can be diagnosed.
const status = (o) => writeFile(STATUS, JSON.stringify({ at: new Date().toISOString(), ...o }, null, 1));
const URL_LINE = "https://api.winner.co.il/v2/publicapi/GetCMobileLine?lineChecksum=0";

async function main() {
  await mkdir(new URL("../data/raw/", import.meta.url), { recursive: true });
  let res;
  try {
    res = await fetch(URL_LINE, {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "he-IL,he;q=0.9,en;q=0.8",
        origin: "https://www.winner.co.il",
        referer: "https://www.winner.co.il/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(60000),
    });
  } catch (e) {
    console.log(`Winner: couldn't connect (${e.message}); keeping previous odds`);
    await status({ ok: false, error: `${e.name}: ${e.message}`, cause: String(e.cause ?? "") });
    return;
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON: blocked or error page */ }
  if (!res.ok || !json?.markets) {
    console.log(`Winner: HTTP ${res.status}, ${text.length} bytes, not the line (${text.slice(0, 120).replace(/\s+/g, " ")}); keeping previous odds`);
    await status({ ok: false, http: res.status, bytes: text.length, headers: Object.fromEntries(res.headers), body: text.slice(0, 600) });
    return;
  }
  const events = parseLine(json.markets);
  const prev = JSON.parse(await readFile(OUT, "utf8").catch(() => "null"));
  await writeFile(OUT, JSON.stringify({ source: "winner.co.il public line", fetchedAt: new Date().toISOString(), events }));
  await status({ ok: true, markets: json.markets.length, games: events.length });
  console.log(`Winner: ${json.markets.length} markets, ${events.length} games in our leagues${prev ? ` (was ${prev.events.length})` : ""}`);
}
main();
