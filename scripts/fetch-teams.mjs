// Club logos and colours, from free sources, into data/raw/teams.json.
//   ESPN's public team lists: every football league we cover, the UEFA cups and the NBA
//     (logo and main club colour).
//   TheSportsDB: badges for Ligat Winner, Israeli basketball and the EuroLeague, read from
//     recent and upcoming games; any team still missing is looked up by name, a few per run.
// Logos change rarely, so known teams are kept between runs and only gaps are filled.
import { readFile, writeFile } from "node:fs/promises";
import { LEAGUES } from "./leagues.mjs";

const OUT = new URL("../data/raw/teams.json", import.meta.url);
const RAW = new URL("../data/raw/", import.meta.url);
const TSDB = `https://www.thesportsdb.com/api/v1/json/${process.env.TSDB_KEY || "123"}`;
const ESPN = "https://site.api.espn.com/apis/site/v2/sports";
const TSDB_GAP_MS = Number(process.env.TSDB_GAP_MS || 7000);
const SEARCHES_PER_RUN = 12;

const ESPN_LISTS = {
  "il-premier": "soccer/isr.1", epl: "soccer/eng.1", laliga: "soccer/esp.1", seriea: "soccer/ita.1", bundesliga: "soccer/ger.1",
  ligue1: "soccer/fra.1", eredivisie: "soccer/ned.1", primeira: "soccer/por.1", championship: "soccer/eng.2",
  ucl: "soccer/uefa.champions", uel: "soccer/uefa.europa", uecl: "soccer/uefa.europa.conf", nba: "basketball/nba",
};
const TSDB_LEAGUES = { "il-premier": 4644, "il-basket": 4474, euroleague: 4546 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastTsdb = 0;
async function get(url, tsdb = false) {
  if (tsdb) { const w = lastTsdb + TSDB_GAP_MS - Date.now(); if (w > 0) await sleep(w); lastTsdb = Date.now(); }
  try {
    const res = await fetch(url, { headers: { "user-agent": "winner-tips-israel data job" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) { console.log(`  ${res.status} ${url}`); return null; }
    return await res.json();
  } catch (e) { console.log(`  failed ${url}: ${e.message}`); return null; }
}

const prev = JSON.parse(await readFile(OUT, "utf8").catch(() => "null")) || { teams: {} };
const teams = prev.teams; // key "<sport>|<name as the source writes it>" -> { logo, color, names[] }
const put = (sport, names, logo, color) => {
  if (!logo) return;
  const all = [...new Set(names.filter(Boolean))];
  for (const n of all) teams[`${sport}|${n}`] = { logo, color: color ? `#${color.replace("#", "")}` : teams[`${sport}|${n}`]?.color ?? null };
};

// ESPN
for (const [key, slug] of Object.entries(ESPN_LISTS)) {
  const j = await get(`${ESPN}/${slug}/teams`);
  const list = j?.sports?.[0]?.leagues?.[0]?.teams?.map((x) => x.team) ?? [];
  const sport = slug.startsWith("basketball") ? "basketball" : "football";
  for (const t of list) put(sport, [t.displayName, t.shortDisplayName, t.name, t.location], t.logos?.[0]?.href, t.color);
  console.log(`ESPN ${key}: ${list.length} teams`);
}

// TheSportsDB: badges ride along with each game
for (const [key, id] of Object.entries(TSDB_LEAGUES)) {
  const sport = LEAGUES.find((l) => l.key === key).sport;
  let n = 0;
  for (const ep of ["eventspastleague", "eventsnextleague"]) {
    const j = await get(`${TSDB}/${ep}.php?id=${id}`, true);
    for (const e of j?.events ?? []) {
      put(sport, [e.strHomeTeam], e.strHomeTeamBadge); put(sport, [e.strAwayTeam], e.strAwayTeamBadge); n++;
    }
  }
  console.log(`TheSportsDB ${key}: ${n} games read`);
}

// Teams in our fixtures that still have no logo: look a few up by name.
const ours = new Set();
for (const lg of LEAGUES) {
  const d = JSON.parse(await readFile(new URL(`${lg.key}.json`, RAW), "utf8").catch(() => "null"));
  const recent = (d?.matches ?? []).filter((m) => Date.parse(m.kickoff) > Date.now() - 200 * 86400e3);
  for (const m of recent) { ours.add(`${lg.sport}|${m.home}`); ours.add(`${lg.sport}|${m.away}`); }
}
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const known = new Set(Object.keys(teams).map((k) => { const [s, n] = k.split("|"); return `${s}|${norm(n)}`; }));
const tried = new Set(prev.tried ?? []);
const missing = [...ours].filter((k) => { const [s, n] = k.split("|"); return !known.has(`${s}|${norm(n)}`) && !tried.has(k); });
for (const k of missing.slice(0, SEARCHES_PER_RUN)) {
  const [sport, name] = k.split("|");
  const j = await get(`${TSDB}/searchteams.php?t=${encodeURIComponent(name.replace(/^(FC|AFC|SC|BC)\s+|\s+(FC|AFC|SC|BC)$/g, ""))}`, true);
  const want = sport === "football" ? "Soccer" : "Basketball";
  const t = (j?.teams ?? []).find((x) => x.strSport === want);
  if (t) put(sport, [name, t.strTeam], t.strBadge, t.strColour1);
  if (j) tried.add(k); // a failed request is tried again next run
}
console.log(`Logos: ${Object.keys(teams).length} names known; ${missing.length} of our teams were missing, searched ${Math.min(missing.length, SEARCHES_PER_RUN)}`);
await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), teams, tried: [...tried] }));
