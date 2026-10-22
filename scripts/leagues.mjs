// Every competition the site covers, and where its free data comes from.
//
// source "openfootball": public-domain fixtures and results from
//   https://github.com/openfootball/football.json (one file per league per season).
// source "tsdb": TheSportsDB free API (https://www.thesportsdb.com), fetched round by round.
// source "espn": ESPN's public scoreboard feed, one request per day; finished days are cached.
//
// `elo` is the starting rating for a club first seen in that league. It only matters for
// cross-league games (the UEFA cups), where clubs from different leagues meet.

export const LEAGUES = [
  // ---- Football: Israel ----
  { key: "il-premier", name: "Ligat Winner", country: "Israel", sport: "football", source: "tsdb", tsdbId: 4644,
    seasons: ["2025-2026", "2026-2027"], maxRounds: 36, elo: 1420, tz: "Asia/Jerusalem", featured: true },

  // ---- Football: Europe's top leagues (all on Winner's coupon) ----
  { key: "epl", name: "Premier League", country: "England", sport: "football", source: "openfootball", file: "en.1",
    seasons: ["2025-26", "2026-27"], elo: 1700, tz: "Europe/London", tsdbId: 4328 },
  { key: "laliga", name: "La Liga", country: "Spain", sport: "football", source: "openfootball", file: "es.1",
    seasons: ["2025-26", "2026-27"], elo: 1680, tz: "Europe/Madrid", tsdbId: 4335 },
  { key: "seriea", name: "Serie A", country: "Italy", sport: "football", source: "openfootball", file: "it.1",
    seasons: ["2025-26", "2026-27"], elo: 1660, tz: "Europe/Rome", tsdbId: 4332 },
  { key: "bundesliga", name: "Bundesliga", country: "Germany", sport: "football", source: "openfootball", file: "de.1",
    seasons: ["2025-26", "2026-27"], elo: 1660, tz: "Europe/Berlin", tsdbId: 4331 },
  { key: "ligue1", name: "Ligue 1", country: "France", sport: "football", source: "openfootball", file: "fr.1",
    seasons: ["2025-26", "2026-27"], elo: 1620, tz: "Europe/Paris", tsdbId: 4334 },
  { key: "eredivisie", name: "Eredivisie", country: "Netherlands", sport: "football", source: "openfootball", file: "nl.1",
    seasons: ["2025-26", "2026-27"], elo: 1560, tz: "Europe/Amsterdam", tsdbId: 4337 },
  { key: "primeira", name: "Primeira Liga", country: "Portugal", sport: "football", source: "openfootball", file: "pt.1",
    seasons: ["2025-26", "2026-27"], elo: 1580, tz: "Europe/Lisbon", tsdbId: 4344 },
  { key: "championship", name: "Championship", country: "England", sport: "football", source: "openfootball", file: "en.2",
    seasons: ["2025-26", "2026-27"], elo: 1560, tz: "Europe/London", tsdbId: 4329 },

  // ---- Football: UEFA cups (current season only; ratings come from the domestic leagues) ----
  { key: "ucl", name: "Champions League", country: "Europe", sport: "football", source: "espn", espn: "soccer/uefa.champions",
    seasons: [{ season: "2026-2027", from: "2026-06-15", to: "2027-06-15" }], elo: 1550, cup: true },
  { key: "uel", name: "Europa League", country: "Europe", sport: "football", source: "espn", espn: "soccer/uefa.europa",
    seasons: [{ season: "2026-2027", from: "2026-06-15", to: "2027-06-15" }], elo: 1500, cup: true },
  { key: "uecl", name: "Conference League", country: "Europe", sport: "football", source: "espn", espn: "soccer/uefa.europa.conf",
    seasons: [{ season: "2026-2027", from: "2026-06-15", to: "2027-06-15" }], elo: 1450, cup: true },

  // ---- Basketball ----
  { key: "il-basket", name: "Israeli Basketball League", country: "Israel", sport: "basketball", source: "tsdb", tsdbId: 4474,
    seasons: ["2025-2026", "2026-2027"], maxRounds: 36, elo: 1450, tz: "Asia/Jerusalem", featured: true },
  { key: "euroleague", name: "EuroLeague", country: "Europe", sport: "basketball", source: "tsdb", tsdbId: 4546,
    seasons: ["2025-2026", "2026-2027"], maxRounds: 40, elo: 1550 },
  { key: "nba", name: "NBA", country: "USA", sport: "basketball", source: "espn", espn: "basketball/nba",
    seasons: [{ season: "2025-2026", from: "2025-10-21", to: "2026-06-25" }, { season: "2026-2027", from: "2026-10-20", to: "2027-06-25" }], elo: 1500 },
];
