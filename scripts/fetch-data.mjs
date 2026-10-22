// Fetches fixtures and results for every league in leagues.mjs from free sources and writes
// one normalised file per league to data/raw/<key>.json.
//
// Runs in GitHub Actions on a schedule (see .github/workflows/data.yml), so visitors never
// hit the data providers themselves. Run it locally with `npm run data:fetch`.
//
// TheSportsDB's free key allows about 30 requests a minute, so rounds whose matches are all
// finished are kept from the previous run and only open rounds are fetched again. Every 24
// hours (or with --full) every round is fetched again to pick up late corrections.
//
// Usage: node scripts/fetch-data.mjs [league keys...] [--full]

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { LEAGUES } from "./leagues.mjs";

const RAW_DIR = new URL("../data/raw/", import.meta.url);
const TSDB = `https://www.thesportsdb.com/api/v1/json/${process.env.TSDB_KEY || "123"}`;
const OPENFOOTBALL = "https://raw.githubusercontent.com/openfootball/football.json/master";
const NBA_SCHEDULE = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json";
// The free key throttles bursts with a two-minute penalty, so pace requests well under it.
const TSDB_GAP_MS = Number(process.env.TSDB_GAP_MS || 5000);
// Stop starting new TheSportsDB work after this long; what is done is saved and the next run continues.
const BUDGET_MS = Number(process.env.FETCH_BUDGET_MIN || 30) * 60e3;
const STARTED = Date.now();
const overBudget = () => Date.now() - STARTED > BUDGET_MS;
const FULL_EVERY_MS = 24 * 3600 * 1000;

const args = process.argv.slice(2);
const forceFull = args.includes("--full");
const picked = args.filter((a) => !a.startsWith("--"));
// Cheap sources first (one request per league), then TheSportsDB round by round.
const order = { nba: 0, openfootball: 1, tsdb: 2 };
const leagues = (picked.length ? LEAGUES.filter((l) => picked.includes(l.key)) : LEAGUES)
  .slice().sort((a, b) => order[a.source] - order[b.source] || Number(!!b.featured) - Number(!!a.featured));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastTsdb = 0;

async function getJson(url, { tries = 5, tsdb = false } = {}) {
  if (tsdb) {
    const wait = lastTsdb + TSDB_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastTsdb = Date.now();
  }
  const res = await fetch(url, { headers: { "user-agent": "winner-tips-israel data job" } });
  if (res.status === 429 && tries > 0) {
    if (overBudget()) throw new Error("rate limited and out of time; will continue next run");
    const wait = (Number(res.headers.get("retry-after")) || 30) + 2;
    console.log(`  rate limited, waiting ${wait}s`);
    await sleep(wait * 1000);
    return getJson(url, { tries: tries - 1, tsdb });
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (tries > 0) {
      await sleep(15000);
      return getJson(url, { tries: tries - 1, tsdb });
    }
    throw new Error(`${url}: not JSON`);
  }
}

// ---------- time helpers ----------

// Converts a local wall-clock time in an IANA time zone to a UTC ISO string.
function zonedToUtc(date, time, tz) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(guess));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const asIfUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return new Date(guess - (asIfUtc - guess)).toISOString();
}

const FINISHED_TSDB = new Set(["FT", "AET", "PEN", "AOT", "AP", "Match Finished", "Finished", "AWD", "WO"]);
const POSTPONED_TSDB = new Set(["PST", "Postponed", "CANC", "Cancelled", "ABD", "Abandoned"]);

// ---------- sources ----------

function fromTsdbEvent(e, season) {
  const hs = e.intHomeScore === null || e.intHomeScore === "" ? null : Number(e.intHomeScore);
  const as = e.intAwayScore === null || e.intAwayScore === "" ? null : Number(e.intAwayScore);
  const raw = e.strStatus || "";
  let status = "NS";
  if (POSTPONED_TSDB.has(raw)) status = "PST";
  else if (FINISHED_TSDB.has(raw) || (hs !== null && as !== null && raw !== "NS" && raw !== "Not Started")) status = "FT";
  else if (raw && raw !== "NS" && raw !== "Not Started" && raw !== "TBD") status = "LIVE";
  const kickoff = e.strTimestamp
    ? new Date(e.strTimestamp.endsWith("Z") || e.strTimestamp.includes("+") ? e.strTimestamp : e.strTimestamp + "Z").toISOString()
    : `${e.dateEvent}T${(e.strTime || "12:00:00").slice(0, 8)}Z`;
  return {
    id: `tsdb-${e.idEvent}`,
    season,
    round: e.intRound ? String(e.intRound) : null,
    kickoff,
    home: e.strHomeTeam,
    away: e.strAwayTeam,
    hs: status === "FT" ? hs : null,
    as: status === "FT" ? as : null,
    status,
    venue: e.strVenue || null,
  };
}

async function fetchTsdb(league, prev, full) {
  const prevRounds = prev?.rounds || {};
  const rounds = {};
  let fetched = 0, partial = false;
  for (const season of league.seasons) {
    for (let r = 1; r <= league.maxRounds; r++) {
      const key = `${season}:${r}`;
      const old = prevRounds[key];
      const settled = old && old.matches.length > 0 && old.matches.every((m) => m.status === "FT" || m.status === "PST");
      const oldEmpty = old && old.matches.length === 0;
      // Keep settled rounds, and empty rounds from a past season, unless this is a full refresh.
      const pastSeason = season !== league.seasons.at(-1);
      // Past seasons are fetched once and kept (unless --full); current-season rounds are kept
      // once settled, and refreshed on the daily full pass to catch corrections.
      const keep = old && ((pastSeason && !forceFull) || (!full && (settled || oldEmpty)));
      if (keep) { rounds[key] = old; continue; }
      if (overBudget()) { if (old) rounds[key] = old; partial = true; continue; }
      let j;
      try { j = await getJson(`${TSDB}/eventsround.php?id=${league.tsdbId}&r=${r}&s=${season}`, { tsdb: true }); }
      catch (err) { console.log(`  round ${r} (${season}): ${err.message}`); if (old) rounds[key] = old; partial = true; continue; }
      fetched++;
      rounds[key] = { fetchedAt: new Date().toISOString(), matches: (j?.events || []).map((e) => fromTsdbEvent(e, season)) };
    }
  }
  console.log(`  ${fetched} rounds fetched from TheSportsDB${partial ? " (stopped early; the next run continues)" : ""}`);
  const seen = new Set();
  const matches = Object.values(rounds).flatMap((x) => x.matches).filter((m) => !seen.has(m.id) && seen.add(m.id));
  return { matches, rounds, partial };
}

async function fetchOpenfootball(league) {
  const matches = [];
  for (const season of league.seasons) {
    const j = await getJson(`${OPENFOOTBALL}/${season}/${league.file}.json`);
    if (!j) { console.log(`  no openfootball file for ${season}`); continue; }
    for (const [i, m] of (j.matches || []).entries()) {
      // Most entries carry { ft: [h, a], ht: [...] }; some carry the full-time score as a bare [h, a].
      const ft = Array.isArray(m.score) ? m.score : m.score?.ft;
      const done = Array.isArray(ft) && ft.length === 2;
      matches.push({
        id: `of-${league.key}-${season}-${i}`,
        season,
        round: m.round ? m.round.replace(/^Matchday\s*/i, "") : null,
        kickoff: zonedToUtc(m.date, m.time, league.tz),
        home: m.team1,
        away: m.team2,
        hs: done ? ft[0] : null,
        as: done ? ft[1] : null,
        status: done ? "FT" : "NS",
        venue: null,
      });
    }
  }
  try { await fillRecentFromTsdb(league, matches); }
  catch (err) { console.log(`  could not fill recent results: ${err.message}`); }
  return { matches };
}

// openfootball is volunteer-maintained and can run a couple of weeks behind. For rounds that
// have already kicked off but have no scores yet, take the results from TheSportsDB.
const normName = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(fc|afc|cf|sc|ac|ssc|sv|vfb|vfl|tsg|bv|fk|cd|ud|rc|rcd|sd|ca|as|ogc|stade|club|de|calcio|1\.)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ").trim();
const sameTeam = (a, b) => {
  const x = normName(a), y = normName(b);
  return x === y || x.includes(y) || y.includes(x) || x.split(" ")[0] === y.split(" ")[0] && x.split(" ")[0].length > 4;
};

async function fillRecentFromTsdb(league, matches) {
  if (!league.tsdbId) return;
  const now = Date.now();
  const season = league.seasons.at(-1);
  const tsdbSeason = `${season.slice(0, 4)}-20${season.slice(5, 7)}`; // "2026-27" -> "2026-2027"
  const stale = matches.filter((m) => m.season === season && m.status !== "FT" && Date.parse(m.kickoff) < now - 2 * 3600e3);
  const rounds = [...new Set(stale.map((m) => m.round).filter(Boolean))].slice(-6);
  let filled = 0;
  for (const r of rounds) {
    if (overBudget()) break;
    const j = await getJson(`${TSDB}/eventsround.php?id=${league.tsdbId}&r=${r}&s=${tsdbSeason}`, { tsdb: true });
    for (const e of j?.events || []) {
      const t = fromTsdbEvent(e, season);
      if (t.status !== "FT") continue;
      const m = stale.find((x) => x.round === r && x.status !== "FT" && sameTeam(x.home, t.home) && sameTeam(x.away, t.away));
      if (m) { m.hs = t.hs; m.as = t.as; m.status = "FT"; m.kickoff = t.kickoff; filled++; }
    }
  }
  if (rounds.length) console.log(`  filled ${filled} recent results from TheSportsDB (${rounds.length} rounds)`);
}

async function fetchNba() {
  const j = await getJson(NBA_SCHEDULE);
  const out = [];
  const season = j?.leagueSchedule?.seasonYear || "";
  for (const day of j?.leagueSchedule?.gameDates || []) {
    for (const g of day.games || []) {
      // Pre-season and All-Star games are left out; regular season ids start with 002, playoffs 004, play-in 005.
      if (!/^00[245]/.test(g.gameId)) continue;
      const done = g.gameStatus === 3;
      out.push({
        id: `nba-${g.gameId}`,
        season,
        round: g.weekNumber ? String(g.weekNumber) : null,
        kickoff: g.gameDateTimeUTC,
        home: `${g.homeTeam.teamCity} ${g.homeTeam.teamName}`.trim(),
        away: `${g.awayTeam.teamCity} ${g.awayTeam.teamName}`.trim(),
        hs: done ? g.homeTeam.score : null,
        as: done ? g.awayTeam.score : null,
        status: done ? "FT" : g.gameStatus === 2 ? "LIVE" : "NS",
        venue: g.arenaName || null,
      });
    }
  }
  return { matches: out };
}

// ---------- main ----------

await mkdir(RAW_DIR, { recursive: true });
let failures = 0;
for (const league of leagues) {
  const file = new URL(`${league.key}.json`, RAW_DIR);
  let prev = null;
  try { prev = JSON.parse(await readFile(file, "utf8")); } catch {}
  const full = forceFull || !prev?.fullAt || Date.now() - Date.parse(prev.fullAt) > FULL_EVERY_MS;
  console.log(`== ${league.name} (${league.source}${league.source === "tsdb" ? (full ? ", full" : ", quick") : ""})`);
  try {
    let result;
    if (league.source === "tsdb") result = await fetchTsdb(league, prev, full);
    else if (league.source === "openfootball") result = await fetchOpenfootball(league);
    else if (league.source === "nba") result = await fetchNba();
    result.matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    const done = result.matches.filter((m) => m.status === "FT").length;
    console.log(`  ${result.matches.length} matches, ${done} finished`);
    if (!result.matches.length && prev?.matches?.length) throw new Error("source returned nothing; keeping previous data");
    await writeFile(file, JSON.stringify({
      key: league.key,
      source: league.source,
      fetchedAt: new Date().toISOString(),
      fullAt: league.source !== "tsdb" || (full && !result.partial) ? new Date().toISOString() : prev?.fullAt,
      matches: result.matches,
      ...(result.rounds ? { rounds: result.rounds } : {}),
    }));
  } catch (err) {
    failures++;
    console.error(`  failed: ${err.message}`);
  }
}
if (failures === leagues.length) process.exit(1);
