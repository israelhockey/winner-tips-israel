// The model's own picks: every bet where Winner pays at least VALUE_EDGE over our fair price,
// logged before kickoff and never edited.
//
// Tamper-evidence: each pick carries the SHA-256 of its locked fields plus the previous
// pick's hash, so the picks form a chain. Change, delete or back-date any pick and every hash
// after it breaks. The /verify page recomputes the chain in the reader's own browser.
//
// Closing price: until kickoff, each run records Winner's current odds for the pick. After
// kickoff the last one seen is the closing price; beating it is the clearest sign of skill.
import { createHash } from "node:crypto";

export const LOCKED_FIELDS = ["id", "lockedAt", "matchId", "league", "event", "kickoff", "market", "line", "selection", "label", "odds", "p", "units"];
export const GENESIS = "0".repeat(64);

export const hashPick = (pick, prevHash) =>
  createHash("sha256").update(prevHash + JSON.stringify(LOCKED_FIELDS.map((k) => pick[k] ?? null))).digest("hex");

const PICKABLE = new Set(["1X2", "Handicap", "Goals", "Winner", "Points"]);
const MAX_ODDS = 7;              // long shots swing the record on luck; leave them out
const MIN_LEAD_MS = 20 * 60e3;   // never lock a pick in the last 20 minutes
const MAX_LEAD_MS = 36 * 3600e3; // and not more than a day and a half out, when news can still move it

// Returns the updated ledger (old picks untouched apart from closing-price fields).
export function updateLedger(ledger, upcoming, now, valueEdge) {
  const picks = [...ledger];
  const byMatch = new Set(picks.map((p) => p.matchId));
  const t = Date.parse(now);

  // 1. Closing prices for picks not yet started.
  for (const p of picks) {
    if (Date.parse(p.kickoff) <= t) continue;
    const m = upcoming.find((x) => x.id === p.matchId);
    const mk = m?.winner?.markets.find((x) => x.market === p.market && (x.line ?? null) === (p.line ?? null));
    const i = mk ? mk.sels.indexOf(p.selection) : -1;
    if (i >= 0) { p.closingOdds = mk.odds[i]; p.closingSeenAt = now; }
  }

  // 2. New picks: the best value bet on each game, one per game.
  let prev = picks.at(-1)?.hash ?? GENESIS;
  let n = picks.filter((p) => p.lockedAt.slice(0, 10) === now.slice(0, 10)).length;
  const fresh = upcoming
    .filter((m) => m.winner && !byMatch.has(m.id))
    .filter((m) => { const lead = Date.parse(m.kickoff) - t; return lead > MIN_LEAD_MS && lead < MAX_LEAD_MS; })
    .map((m) => {
      const options = m.winner.markets
        .filter((x) => PICKABLE.has(x.market) && !(m.sport === "basketball" && x.sels.length === 3)) // no-overtime handicaps are graded on regulation time, which we don't have
        .flatMap((x) => x.sels.map((sel, i) => ({ x, sel, i, edge: x.edge[i], odds: x.odds[i] })))
        .filter((o) => o.edge >= valueEdge && o.odds <= MAX_ODDS)
        .sort((a, b) => b.edge - a.edge);
      return options[0] ? { m, o: options[0] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.m.kickoff.localeCompare(b.m.kickoff));

  for (const { m, o } of fresh) {
    n++;
    const e = o.edge;
    const pick = {
      id: `M-${now.slice(0, 10).replaceAll("-", "")}-${String(n).padStart(2, "0")}`,
      lockedAt: now,
      matchId: m.id,
      league: m.league,
      event: `${m.home} v ${m.away}`,
      kickoff: m.kickoff,
      market: o.x.market,
      line: o.x.line ?? null,
      selection: o.sel,
      label: o.x.labels[o.i],
      odds: o.odds,
      p: o.x.p[o.i],
      units: 1,
      edge: e,
      confidence: e >= 0.12 ? 3 : e >= 0.08 ? 2 : 1,
      tier: "free",
      tipster: "Line Up model",
      analysis: `Winner pays ${o.odds.toFixed(2)}. We make it ${Math.round(o.x.p[o.i] * 100)}%, a fair price of ${(1 / o.x.p[o.i]).toFixed(2)}: ${Math.round(e * 100)}% more than it's worth.`,
      closingOdds: o.odds,
      closingSeenAt: now,
      prevHash: prev,
    };
    pick.hash = hashPick(pick, prev);
    prev = pick.hash;
    picks.push(pick);
  }
  return { picks, added: fresh.length };
}

// Recompute the chain; returns the index of the first broken pick, or -1 if it's intact.
export function verifyChain(picks) {
  let prev = GENESIS;
  for (let i = 0; i < picks.length; i++) {
    if (picks[i].prevHash !== prev || hashPick(picks[i], prev) !== picks[i].hash) return i;
    prev = picks[i].hash;
  }
  return -1;
}
