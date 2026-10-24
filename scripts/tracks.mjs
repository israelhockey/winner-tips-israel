// Tracks: different ways of scoring the site, logged automatically for every game.
//
// Each run, every game that hasn't started gets a fresh snapshot of what we'd have said about
// it. At kickoff the last snapshot is frozen, so every entry is a genuine before-the-game call.
// After the final whistle each call is graded from the score. (The sealed value picks are the
// strict, verifiable track; these are the wide-angle view.)

export const TRACKS = [
  { key: "favourite", name: "Our favourite", desc: "Every game: did the result we rated likeliest happen? Profit is backing it at Winner's odds, 1 unit a game." },
  { key: "value", name: "Every value tag", desc: "Every bet we flagged green (Winner paying 5%+ over our fair price), all markets, 1 unit each." },
  { key: "disagree", name: "Model vs Winner", desc: "Games where our model alone picks a different favourite from Winner's. Who called it? Profit is backing the model's side at Winner's odds." },
  { key: "goals", name: "Goals call", desc: "Every football game: over or under 2.5 goals, whichever we rate likelier." },
  { key: "upset", name: "Upset alert", desc: "Underdogs (Winner odds 3.00+) we rate at least 6 points likelier than Winner's price says." },
  { key: "lines", name: "Basketball lines", desc: "Our side of Winner's basketball handicap, every game it's offered." },
];

const VALUE_EDGE = 0.05;

function calls(m) {
  const out = [];
  const w = m.winner;
  const fb = !!m.model?.["1x2"];
  const p = w?.p ?? (fb ? [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]] : m.model?.win ? [m.model.win["1"], m.model.win["2"]] : null);
  if (!p) return out;
  const sels = p.length === 3 ? ["1", "X", "2"] : ["1", "2"];
  const mainMarket = fb ? "1X2" : "Winner";
  const label = (s) => (s === "1" ? m.home : s === "2" ? m.away : "Draw");
  const fi = p.indexOf(Math.max(...p));
  const odds = w?.odds?.[fi] ?? null;
  out.push({ track: "favourite", market: mainMarket, selection: sels[fi], line: null, label: label(sels[fi]), p: p[fi], odds });

  if (w?.markets) {
    for (const x of w.markets) x.sels.forEach((s, i) => {
      if (x.edge[i] >= VALUE_EDGE && x.odds[i] <= 7 && !(m.sport === "basketball" && x.sels.length === 3))
        out.push({ track: "value", market: x.market, selection: s, line: x.line ?? null, label: x.labels[i], p: x.p[i], odds: x.odds[i] });
    });
  }

  if (w?.odds) {
    // Us vs Winner uses the model on its own: the blended chance already leans on Winner's prices.
    const mp = fb ? [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]] : [m.model.win["1"], m.model.win["2"]];
    const mi = mp.indexOf(Math.max(...mp));
    const wf = w.odds.indexOf(Math.min(...w.odds)); // Winner's favourite: its shortest price
    if (mi !== wf && w.odds.length === mp.length) out.push({ track: "disagree", market: mainMarket, selection: sels[mi], line: null, label: label(sels[mi]), p: mp[mi], odds: w.odds[mi], winnerPick: sels[wf], winnerLabel: label(sels[wf]) });
    sels.forEach((s, i) => {
      const implied = (1 / w.odds[i]) / w.odds.reduce((a, o) => a + 1 / o, 0);
      if (w.odds[i] >= 3 && p[i] - implied >= 0.06) out.push({ track: "upset", market: mainMarket, selection: s, line: null, label: label(s), p: p[i], odds: w.odds[i] });
    });
  }

  if (fb) {
    const g = w?.markets?.find((x) => x.market === "Goals" && x.line === 2.5);
    const over = g ? g.p[0] : m.model.ou["2.5"];
    const side = over >= 0.5 ? 0 : 1;
    out.push({ track: "goals", market: "Goals", selection: side ? "Under" : "Over", line: 2.5, label: `${side ? "Under" : "Over"} 2.5 goals`, p: side ? 1 - over : over, odds: g ? g.odds[side] : null });
  } else {
    const h = w?.markets?.find((x) => x.market === "Handicap" && x.sels.length === 2);
    if (h) { const i = h.p[0] >= h.p[1] ? 0 : 1; out.push({ track: "lines", market: "Handicap", selection: h.sels[i], line: h.line, label: h.labels[i], p: h.p[i], odds: h.odds[i] }); }
  }
  return out;
}

import { probeFor } from "./tuning.mjs";

// entries: [{ matchId, league, event, kickoff, lockedAt, calls: [...] }]
export function updateTracks(entries, upcoming, now) {
  const t = Date.parse(now);
  const byId = new Map(entries.map((e) => [e.matchId, e]));
  for (const m of upcoming) {
    if (Date.parse(m.kickoff) <= t) continue; // started: frozen
    const c = calls(m);
    if (!c.length) continue;
    byId.set(m.id, { matchId: m.id, league: m.league, sport: m.sport, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, lockedAt: now, calls: c, probe: probeFor(m, byId.get(m.id)?.probe) });
  }
  return [...byId.values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

// grade(pick, match) -> "won" | "lost" | "void" | null; matchById for final scores.
export function scoreTracks(entries, matchById, grade, leagueName, now) {
  const t = Date.parse(now);
  return TRACKS.map((tr) => {
    const rows = [];
    for (const e of entries) {
      if (Date.parse(e.kickoff) > t) continue; // only frozen calls count
      const m = matchById.get(e.matchId);
      for (const c of e.calls.filter((x) => x.track === tr.key)) {
        const result = grade(c, m) ?? "pending";
        const profit = c.odds && (result === "won" || result === "lost") ? (result === "won" ? c.odds - 1 : -1) : null;
        rows.push({ event: e.event, league: leagueName[e.league] ?? e.league, kickoff: e.kickoff, label: c.label, market: c.market, p: c.p, odds: c.odds, winnerLabel: c.winnerLabel, result, profit, final: m?.status === "FT" ? `${m.hs}-${m.as}` : null });
      }
    }
    const graded = rows.filter((r) => r.result === "won" || r.result === "lost");
    const priced = graded.filter((r) => r.profit !== null);
    const profit = priced.reduce((s, r) => s + r.profit, 0);
    const expected = graded.reduce((s, r) => s + r.p, 0); // how many we'd expect to land if our percentages are right
    return {
      ...tr,
      summary: {
        calls: rows.length, graded: graded.length, pending: rows.length - graded.length,
        won: graded.filter((r) => r.result === "won").length,
        hitRate: graded.length ? Math.round((graded.filter((r) => r.result === "won").length / graded.length) * 1000) / 1000 : null,
        expectedHits: Math.round(expected * 10) / 10,
        staked: priced.length, units: Math.round(profit * 100) / 100,
        roi: priced.length ? Math.round((profit / priced.length) * 1000) / 1000 : null,
        last10: graded.slice(-10).map((r) => (r.result === "won" ? "W" : "L")),
      },
      recent: rows.slice(-40).reverse(),
    };
  });
}
