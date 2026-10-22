// Turns data/raw/*.json into what the site shows, in public/data/:
//   index.json            every league, the next fixtures across all of them, and the record summary
//   leagues/<key>.json    table, ratings, fixtures with model predictions, results, model check
//   record.json           the settled picks ledger (from content/picks.json)
//
// Football (domestic leagues): a Poisson goals model with team attack/defence strengths,
//   recent matches weighted more (half-life 180 days), the Dixon-Coles low-score correction,
//   and shrinkage towards the league average so promoted teams start sensibly.
// Football (UEFA cups): one Elo rating across every league we cover, turned into expected goals.
// Basketball: Elo with margin of victory, carried between seasons with 25% regression.
// Winner: where Winner prices a game, our shown chance blends the model (35%) with Winner's own
//   prices once its margin is taken out (60%), and every Winner market gets a value edge.
//
// Run with `npm run data:model` after `npm run data:fetch`.

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { LEAGUES } from "./leagues.mjs";
import { matchEvents } from "./winner-match.mjs";

const RAW = new URL("../data/raw/", import.meta.url);
const OUT = new URL("../public/data/", import.meta.url);
const PICKS = new URL("../content/picks.json", import.meta.url);
const NOW = Date.now();
const DAY = 86400e3;

const load = async (url) => { try { return JSON.parse(await readFile(url, "utf8")); } catch { return null; } };
const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

// Display names: openfootball writes "Arsenal FC", TheSportsDB "Arsenal".
export const cleanName = (s) => s.replace(/\s+(FC|AFC|CF|SC|BC|F\.C\.|B\.C\.)$/i, "").replace(/^(FC|AFC)\s+/i, "").trim();
const normName = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(fc|afc|cf|sc|ac|ssc|sv|vfb|vfl|tsg|bv|fk|cd|ud|rc|rcd|sd|ca|as|ogc|club|calcio|bc|b c)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ").trim();

// ---------------------------------------------------------------------------------------------
// Football: Poisson team-strength model
// ---------------------------------------------------------------------------------------------

const RHO = -0.08; // Dixon-Coles correction: slightly more 0-0 and 1-1, fewer 1-0 and 0-1
const HALF_LIFE_DAYS = 180;
const PRIOR_GAMES = 4; // shrinkage: each team starts with 4 "average" games

function fitPoisson(matches, asOf) {
  const played = matches.filter((m) => m.status === "FT" && Date.parse(m.kickoff) < asOf && asOf - Date.parse(m.kickoff) < 450 * DAY);
  const teams = [...new Set(played.flatMap((m) => [m.home, m.away]))];
  if (played.length < 20) return null;
  const xi = Math.log(2) / (HALF_LIFE_DAYS * DAY);
  const rows = played.map((m) => ({ h: m.home, a: m.away, hs: m.hs, as: m.as, w: Math.exp(-xi * (asOf - Date.parse(m.kickoff))) }));
  const W = rows.reduce((s, r) => s + r.w, 0);
  const avgH = rows.reduce((s, r) => s + r.w * r.hs, 0) / W;
  const avgA = rows.reduce((s, r) => s + r.w * r.as, 0) / W;
  const mu = Math.log((avgH + avgA) / 2);
  let home = Math.log(Math.max(avgH, 0.3) / Math.max(avgA, 0.3)) / 2;
  const att = Object.fromEntries(teams.map((t) => [t, 0]));
  const def = Object.fromEntries(teams.map((t) => [t, 0]));
  const base = Math.exp(mu);
  for (let it = 0; it < 60; it++) {
    for (const t of teams) {
      // goals scored by t / expected goals for t given its opponents' defence
      let num = PRIOR_GAMES * base, den = PRIOR_GAMES * base;
      for (const r of rows) {
        if (r.h === t) { num += r.w * r.hs; den += r.w * Math.exp(mu + home + def[r.a]); }
        else if (r.a === t) { num += r.w * r.as; den += r.w * Math.exp(mu - home + def[r.h]); }
      }
      att[t] = Math.log(num / den);
    }
    for (const t of teams) {
      let num = PRIOR_GAMES * base, den = PRIOR_GAMES * base;
      for (const r of rows) {
        if (r.h === t) { num += r.w * r.as; den += r.w * Math.exp(mu - home + att[r.a]); }
        else if (r.a === t) { num += r.w * r.hs; den += r.w * Math.exp(mu + home + att[r.h]); }
      }
      def[t] = Math.log(num / den);
    }
    const ma = teams.reduce((s, t) => s + att[t], 0) / teams.length;
    const md = teams.reduce((s, t) => s + def[t], 0) / teams.length;
    for (const t of teams) { att[t] -= ma; def[t] -= md; }
    // home advantage: total home goals vs expected without it
    let hn = 0, hd = 0, an = 0, ad = 0;
    for (const r of rows) {
      hn += r.w * r.hs; hd += r.w * Math.exp(mu + att[r.h] + def[r.a]);
      an += r.w * r.as; ad += r.w * Math.exp(mu + att[r.a] + def[r.h]);
    }
    home = Math.log(hn / hd / (an / ad)) / 2;
  }
  return { mu, home, att, def, teams, n: played.length };
}

// Expected goals for a fixture. A team the model hasn't seen gets league-average strength.
function expectedGoals(model, h, a) {
  const ah = model.att[h] ?? -0.1, dh = model.def[h] ?? 0.1, aa = model.att[a] ?? -0.1, da = model.def[a] ?? 0.1;
  return [Math.exp(model.mu + model.home + ah + da), Math.exp(model.mu - model.home + aa + dh)];
}

function poisson(k, l) { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; }

// Full score matrix (0-10 goals each) with the Dixon-Coles correction, normalised.
function scoreMatrix(lh, la) {
  const N = 10, M = [];
  let s = 0;
  for (let i = 0; i <= N; i++) {
    M.push([]);
    for (let j = 0; j <= N; j++) {
      let p = poisson(i, lh) * poisson(j, la);
      if (i === 0 && j === 0) p *= 1 - lh * la * RHO;
      else if (i === 0 && j === 1) p *= 1 + lh * RHO;
      else if (i === 1 && j === 0) p *= 1 + la * RHO;
      else if (i === 1 && j === 1) p *= 1 - RHO;
      M[i].push(Math.max(p, 0)); s += Math.max(p, 0);
    }
  }
  return M.map((r) => r.map((p) => p / s));
}

// Every market we price, from the score matrix. Handicaps are Winner-style three-way:
// "home -1" means the home side's result after taking one goal off it.
function footballMarkets(lh, la) {
  const M = scoreMatrix(lh, la);
  const sum = (f) => { let s = 0; for (let i = 0; i < M.length; i++) for (let j = 0; j < M.length; j++) if (f(i, j)) s += M[i][j]; return s; };
  const p1 = sum((i, j) => i > j), px = sum((i, j) => i === j), p2 = sum((i, j) => i < j);
  const cs = [];
  for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) cs.push({ score: `${i}-${j}`, p: M[i][j] });
  cs.sort((a, b) => b.p - a.p);
  const hcap = (k) => ({ "1": sum((i, j) => i + k > j), X: sum((i, j) => i + k === j), "2": sum((i, j) => i + k < j) });
  return {
    xg: [round(lh, 2), round(la, 2)],
    "1x2": { "1": round(p1), X: round(px), "2": round(p2) },
    dc: { "1X": round(p1 + px), "12": round(p1 + p2), X2: round(px + p2) },
    ou: Object.fromEntries([1.5, 2.5, 3.5].map((l) => [l, round(sum((i, j) => i + j > l))])),
    btts: round(sum((i, j) => i > 0 && j > 0)),
    hcap: { "-1": mapRound(hcap(-1)), "+1": mapRound(hcap(1)) },
    cs: cs.slice(0, 5).map((x) => ({ score: x.score, p: round(x.p) })),
  };
}
const mapRound = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, round(v)]));

// ---------------------------------------------------------------------------------------------
// Elo (football across leagues, and basketball)
// ---------------------------------------------------------------------------------------------

function runEloFootball(allMatches) {
  // allMatches: [{...match, league}] sorted by kickoff
  const r = new Map();
  const get = (name, lg) => { const k = normName(name); if (!r.has(k)) r.set(k, lg.elo); return r.get(k); };
  for (const m of allMatches) {
    if (m.status !== "FT") continue;
    const lg = m.league;
    const rh = get(m.home, lg), ra = get(m.away, lg);
    const dr = rh + 60 - ra;
    const exp = 1 / (1 + 10 ** (-dr / 400));
    const res = m.hs > m.as ? 1 : m.hs === m.as ? 0.5 : 0;
    const gd = Math.abs(m.hs - m.as);
    const mult = gd <= 1 ? 1 : gd === 2 ? 1.5 : (11 + gd) / 8;
    const k = (lg.cup ? 30 : 20) * mult;
    r.set(normName(m.home), rh + k * (res - exp));
    r.set(normName(m.away), ra - k * (res - exp));
  }
  return { rating: (name, lg) => r.get(normName(name)) ?? lg.elo };
}

function eloToGoals(dr) {
  // Calibrated so a 100-point edge is worth about 0.35 goals of supremacy; 2.7 total goals.
  const sup = dr / 285, total = 2.7;
  return [Math.max(0.2, (total + sup) / 2), Math.max(0.2, (total - sup) / 2)];
}

const BASKET = {
  nba: { hca: 70, sd: 12.5, perPoint: 28 },
  euroleague: { hca: 90, sd: 11, perPoint: 26 },
  "il-basket": { hca: 90, sd: 11.5, perPoint: 26 },
};

function runEloBasketball(matches, key) {
  const cfg = BASKET[key];
  const r = new Map();
  let season = null;
  const pf = new Map(); // recent points for/against per team, for projected totals
  const push = (t, f, a) => { const l = pf.get(t) || []; l.push([f, a]); if (l.length > 15) l.shift(); pf.set(t, l); };
  for (const m of matches) {
    if (m.status !== "FT") continue;
    if (m.season !== season) { // regress 25% to the mean at each new season
      if (season !== null) for (const [t, v] of r) r.set(t, 1500 + 0.75 * (v - 1500));
      season = m.season;
    }
    const rh = r.get(m.home) ?? 1500, ra = r.get(m.away) ?? 1500;
    const dr = rh + cfg.hca - ra;
    const exp = 1 / (1 + 10 ** (-dr / 400));
    const res = m.hs > m.as ? 1 : 0;
    const mov = Math.abs(m.hs - m.as);
    const mult = ((mov + 3) ** 0.8) / (7.5 + 0.006 * (res ? dr : -dr));
    const k = 20 * mult;
    r.set(m.home, rh + k * (res - exp));
    r.set(m.away, ra - k * (res - exp));
    push(m.home, m.hs, m.as); push(m.away, m.as, m.hs);
  }
  const avg = (t, i) => { const l = pf.get(t); return l?.length ? l.reduce((s, x) => s + x[i], 0) / l.length : null; };
  return {
    ratings: r,
    predict(h, a) {
      const dr = (r.get(h) ?? 1500) + cfg.hca - (r.get(a) ?? 1500);
      const pHome = 1 / (1 + 10 ** (-dr / 400));
      const spread = dr / cfg.perPoint; // home margin
      const hf = avg(h, 0), ha = avg(h, 1), af = avg(a, 0), aa = avg(a, 1);
      const total = hf && af ? ((hf + aa) / 2 + (af + ha) / 2) : null;
      return { win: { "1": round(pHome), "2": round(1 - pHome) }, spread: round(spread, 1), total: total ? round(total, 1) : null, sd: cfg.sd };
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------------------------

function table(matches, sport) {
  const t = new Map();
  const row = (n) => t.get(n) || (t.set(n, { team: n, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }), t.get(n));
  for (const m of matches) {
    if (m.status !== "FT") continue;
    const h = row(m.home), a = row(m.away);
    h.p++; a.p++; h.gf += m.hs; h.ga += m.as; a.gf += m.as; a.ga += m.hs;
    const res = m.hs > m.as ? "W" : m.hs < m.as ? "L" : "D";
    if (res === "W") { h.w++; a.l++; h.pts += sport === "football" ? 3 : 2; a.pts += sport === "football" ? 0 : 1; }
    else if (res === "L") { a.w++; h.l++; a.pts += sport === "football" ? 3 : 2; h.pts += sport === "football" ? 0 : 1; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
    h.form.push(res); a.form.push(res === "W" ? "L" : res === "L" ? "W" : "D");
  }
  return [...t.values()]
    .map((r) => ({ ...r, gd: r.gf - r.ga, form: r.form.slice(-5) }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
}

// ---------------------------------------------------------------------------------------------
// Model check: walk-forward, refitting weekly, scored against what actually happened
// ---------------------------------------------------------------------------------------------

function backtestFootball(matches) {
  const done = matches.filter((m) => m.status === "FT").sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  if (done.length < 150) return null;
  const start = Date.parse(done[Math.floor(done.length * 0.35)].kickoff);
  let model = null, fittedAt = 0;
  let n = 0, hit = 0, brier = 0, logloss = 0, baseBrier = 0;
  const buckets = Array.from({ length: 10 }, () => ({ n: 0, p: 0, y: 0 }));
  for (const m of done) {
    const t = Date.parse(m.kickoff);
    if (t < start) continue;
    if (!model || t - fittedAt > 7 * DAY) { model = fitPoisson(done, t); fittedAt = t; }
    if (!model) continue;
    const prior = done.filter((x) => Date.parse(x.kickoff) < t);
    const base = ["1", "X", "2"].map((k) => prior.filter((x) => (k === "1" ? x.hs > x.as : k === "X" ? x.hs === x.as : x.hs < x.as)).length / prior.length);
    const [lh, la] = expectedGoals(model, m.home, m.away);
    const p = footballMarkets(lh, la)["1x2"];
    const probs = [p["1"], p.X, p["2"]];
    const y = [m.hs > m.as, m.hs === m.as, m.hs < m.as].map(Number);
    n++;
    if (probs.indexOf(Math.max(...probs)) === y.indexOf(1)) hit++;
    brier += probs.reduce((s, q, i) => s + (q - y[i]) ** 2, 0);
    baseBrier += base.reduce((s, q, i) => s + (q - y[i]) ** 2, 0);
    logloss += -Math.log(Math.max(probs[y.indexOf(1)], 1e-6));
    for (let i = 0; i < 3; i++) { const b = buckets[Math.min(9, Math.floor(probs[i] * 10))]; b.n++; b.p += probs[i]; b.y += y[i]; }
  }
  if (!n) return null;
  return {
    matches: n,
    from: new Date(start).toISOString().slice(0, 10),
    hitRate: round(hit / n),
    brier: round(brier / n),
    baselineBrier: round(baseBrier / n),
    logLoss: round(logloss / n),
    calibration: buckets.filter((b) => b.n >= 10).map((b) => ({ predicted: round(b.p / b.n), actual: round(b.y / b.n), n: b.n })),
  };
}

// ---------------------------------------------------------------------------------------------
// Picks ledger
// ---------------------------------------------------------------------------------------------

// Settles a pick from the final score when the market is one we can grade automatically.
function grade(pick, m) {
  if (!m || m.status !== "FT") return null;
  const h = m.hs, a = m.as;
  const sel = String(pick.selection);
  switch (pick.market) {
    case "1X2": return (sel === "1" && h > a) || (sel === "X" && h === a) || (sel === "2" && h < a) ? "won" : "lost";
    case "Double chance": return (sel.includes("1") && h > a) || (sel.includes("X") && h === a) || (sel.includes("2") && h < a) ? "won" : "lost";
    case "Handicap": { const k = Number(pick.line); const d = h + k - a; return (sel === "1" && d > 0) || (sel === "X" && d === 0) || (sel === "2" && d < 0) ? "won" : "lost"; }
    case "Over/Under": { const l = Number(pick.line); const t = h + a; if (t === l) return "void"; return (sel === "Over") === (t > l) ? "won" : "lost"; }
    case "BTTS": return (sel === "Yes") === (h > 0 && a > 0) ? "won" : "lost";
    case "Moneyline": return (sel === "1" && h > a) || (sel === "2" && a > h) ? "won" : "lost";
    default: return null;
  }
}

function buildRecord(picks, matchById) {
  const settled = [];
  for (const p of picks) {
    let result = p.result && p.result !== "pending" ? p.result : null;
    if (!result && p.matchId) result = grade(p, matchById.get(p.matchId));
    const m = p.matchId ? matchById.get(p.matchId) : null;
    const profit = result === "won" ? p.units * (p.odds - 1) : result === "lost" ? -p.units : 0;
    settled.push({ ...p, result: result || "pending", profit: round(profit, 2), final: m && m.status === "FT" ? `${m.hs}-${m.as}` : null });
  }
  settled.sort((a, b) => a.lockedAt.localeCompare(b.lockedAt));
  const graded = settled.filter((p) => p.result === "won" || p.result === "lost");
  const staked = graded.reduce((s, p) => s + p.units, 0);
  const profit = settled.reduce((s, p) => s + p.profit, 0);
  let run = 0;
  const curve = settled.filter((p) => p.result !== "pending").map((p) => ({ at: p.lockedAt.slice(0, 10), units: round((run += p.profit), 2) }));
  const split = (key) => Object.values(graded.reduce((acc, p) => {
    const k = p[key] || "Other";
    acc[k] ||= { key: k, picks: 0, won: 0, staked: 0, profit: 0 };
    acc[k].picks++; acc[k].won += p.result === "won" ? 1 : 0; acc[k].staked += p.units; acc[k].profit += p.profit;
    return acc;
  }, {})).map((r) => ({ ...r, profit: round(r.profit, 2), roi: r.staked ? round(r.profit / r.staked) : 0 }));
  const clv = graded.filter((p) => p.closingOdds).map((p) => p.odds / p.closingOdds - 1);
  return {
    summary: {
      picks: settled.length, graded: graded.length, pending: settled.filter((p) => p.result === "pending").length,
      won: graded.filter((p) => p.result === "won").length, units: round(profit, 2), staked: round(staked, 2),
      roi: staked ? round(profit / staked) : 0, avgOdds: graded.length ? round(graded.reduce((s, p) => s + p.odds, 0) / graded.length, 2) : 0,
      beatClosing: clv.length ? round(clv.filter((x) => x > 0).length / clv.length) : null,
      last10: graded.slice(-10).map((p) => (p.result === "won" ? "W" : "L")),
    },
    curve, byLeague: split("leagueName"), byMarket: split("market"), picks: settled.reverse(),
  };
}


// ---------------------------------------------------------------------------------------------
// Winner odds: blend and value
// ---------------------------------------------------------------------------------------------

const MODEL_WEIGHT = 0.35; // the rest goes to Winner's margin-free prices, which know about team news
const VALUE_EDGE = 0.05;

// Normal CDF (Abramowitz-Stegun), for basketball margins and totals.
function Phi(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
const fairOf = (odds) => { const inv = odds.map((o) => 1 / o); const s = inv.reduce((a, b) => a + b, 0); return inv.map((x) => x / s); };
const signed = (x) => (x > 0 ? `+${x}` : `${x}`);

function winnerMarkets(m, ev, sport, sd) {
  const out = [];
  const add = (market, line, sels, labels, modelP, odds) => {
    if (!odds || odds.length !== modelP.length || odds.some((o) => !(o > 1))) return;
    const fair = fairOf(odds);
    const p = modelP.map((x, i) => MODEL_WEIGHT * x + (1 - MODEL_WEIGHT) * fair[i]);
    out.push({
      market, line, sels, labels, odds,
      p: p.map((x) => round(x)), model: modelP.map((x) => round(x)), fair: fair.map((x) => round(x)),
      edge: p.map((x, i) => round(x * odds[i] - 1)),
      margin: round(odds.reduce((a, o) => a + 1 / o, 0) - 1),
    });
  };
  const o = ev.odds;
  if (sport === "football") {
    const M = scoreMatrix(...m.model.xg);
    const sum = (f) => { let s = 0; for (let i = 0; i < M.length; i++) for (let j = 0; j < M.length; j++) if (f(i, j)) s += M[i][j]; return s; };
    const x = m.model["1x2"];
    add("1X2", null, ["1", "X", "2"], [m.home, "Draw", m.away], [x["1"], x.X, x["2"]], o["1x2"]);
    if (o.hcap?.line != null) {
      const k = o.hcap.line;
      add("Handicap", k, ["1", "X", "2"], [`${m.home} ${signed(k)}`, `Draw (${m.home} ${signed(k)})`, `${m.away} ${signed(-k)}`],
        [sum((i, j) => i + k > j), sum((i, j) => i + k === j), sum((i, j) => i + k < j)], o.hcap.odds);
    }
    if (o.total?.line) {
      const over = sum((i, j) => i + j > o.total.line);
      add("Goals", o.total.line, ["Over", "Under"], [`Over ${o.total.line} goals`, `Under ${o.total.line} goals`], [over, 1 - over], [o.total.over, o.total.under]);
    }
  } else {
    const mu0 = m.model.spread;
    add("Winner", null, ["1", "2"], [m.home, m.away], [m.model.win["1"], m.model.win["2"]], o.ml);
    if (o.spread?.line != null) {
      const p1 = Phi((mu0 + o.spread.line) / sd);
      add("Handicap", o.spread.line, ["1", "2"], [`${m.home} ${signed(o.spread.line)}`, `${m.away} ${signed(-o.spread.line)}`], [p1, 1 - p1], o.spread.odds);
    }
    if (o.hcap?.line != null) { // Israeli league: three-way, no overtime
      const mu = mu0 + o.hcap.line;
      const p1 = 1 - Phi((0.5 - mu) / sd), p2 = Phi((-0.5 - mu) / sd);
      add("Handicap", o.hcap.line, ["1", "X", "2"], [`${m.home} ${signed(o.hcap.line)}`, "Draw (handicap)", `${m.away} ${signed(-o.hcap.line)}`], [p1, 1 - p1 - p2, p2], o.hcap.odds);
    }
    if (o.total?.line && m.model.total) {
      const over = 1 - Phi((o.total.line - m.model.total) / (sd * 1.45));
      add("Points", o.total.line, ["Over", "Under"], [`Over ${o.total.line} points`, `Under ${o.total.line} points`], [over, 1 - over], [o.total.over, o.total.under]);
    }
  }
  return out;
}

// Attach Winner's prices to a fixture. The coupon boxes then show the blended chance and
// Winner's odds; basketball games Winner only offers on a handicap get a blended win chance
// from that line.
function withWinner(m, sport) {
  const ev = winnerById.get(m.id);
  if (!ev || !m.model) return m;
  const sd = m.model.sd ?? 12;
  const markets = winnerMarkets(m, ev, sport, sd);
  if (!markets.length) return m;
  let main = markets.find((x) => x.market === "1X2" || x.market === "Winner");
  let p = main?.p ?? null, odds = main?.odds ?? null;
  if (!main && sport === "basketball") {
    const h = markets.find((x) => x.market === "Handicap");
    if (h) {
      const mkt = Phi(-h.line / sd); // the market's line, read as a win chance
      const w = MODEL_WEIGHT * m.model.win["1"] + (1 - MODEL_WEIGHT) * mkt;
      p = [round(w), round(1 - w)];
    }
  }
  const best = markets.flatMap((x) => x.edge.map((e, i) => ({ market: x.market, line: x.line, sel: x.sels[i], label: x.labels[i], odds: x.odds[i], p: x.p[i], edge: e })))
    .sort((a, b) => b.edge - a.edge)[0];
  return {
    ...m,
    winner: { he: [ev.home, ev.away], fetchedAt: winnerRaw.fetchedAt, p, odds, edge: main ? main.edge : null, margin: main?.margin ?? markets[0].margin, markets, best },
  };
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

await mkdir(new URL("leagues/", OUT), { recursive: true });
const files = new Set(await readdir(RAW).catch(() => []));
const raw = {};
for (const lg of LEAGUES) if (files.has(`${lg.key}.json`)) raw[lg.key] = await load(new URL(`${lg.key}.json`, RAW));

// One Elo across every football match we have, for the cups.
const footballAll = LEAGUES.filter((l) => l.sport === "football" && raw[l.key])
  .flatMap((l) => raw[l.key].matches.map((m) => ({ ...m, league: l })))
  .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
const elo = runEloFootball(footballAll);

// Winner's line, matched to our fixtures. Names we've matched before are remembered in
// data/raw/winner-aliases.json; content/winner-names.json holds any we set by hand.
const ALIASES = new URL("winner-aliases.json", RAW);
const winnerRaw = await load(new URL("winner.json", RAW));
const winnerById = new Map();
if (winnerRaw?.events?.length) {
  const learnedBefore = (await load(ALIASES)) || {};
  const manual = (await load(new URL("../content/winner-names.json", import.meta.url))) || {};
  const aliases = {};
  for (const src of [learnedBefore, manual]) for (const [lg, map] of Object.entries(src)) aliases[lg] = { ...aliases[lg], ...map };
  const fixturesByLeague = {};
  for (const lg of LEAGUES) {
    const d = raw[lg.key];
    if (!d?.matches) continue;
    fixturesByLeague[lg.key] = d.matches
      .filter((m) => m.status === "NS" && Date.parse(m.kickoff) > NOW - 3 * 3600e3 && Date.parse(m.kickoff) < NOW + 21 * DAY)
      .map((m) => ({ id: m.id, home: cleanName(m.home), away: cleanName(m.away), kickoff: m.kickoff }));
  }
  const { matched, learned } = matchEvents(winnerRaw.events, fixturesByLeague, aliases);
  for (const x of matched) winnerById.set(x.match.id, x.event);
  const merged = { ...learnedBefore };
  for (const [lg, map] of Object.entries(learned)) merged[lg] = { ...merged[lg], ...map };
  await writeFile(ALIASES, JSON.stringify(merged, null, 1));
  console.log(`Winner: matched ${matched.length} of ${winnerRaw.events.length} games, odds from ${winnerRaw.fetchedAt}`);
}

const index = { updatedAt: new Date().toISOString(), leagues: [], upcoming: [] };
const matchById = new Map();

for (const lg of LEAGUES) {
  const data = raw[lg.key];
  if (!data?.matches?.length) continue; // nothing fetched yet: leave it off the site until it is
  const matches = data.matches.map((m) => ({ ...m, home: cleanName(m.home), away: cleanName(m.away) }));
  for (const m of matches) matchById.set(m.id, { ...m, league: lg.key });
  const seasons = [...new Set(matches.map((m) => m.season))];
  const current = seasons.at(-1);
  const currentMatches = matches.filter((m) => m.season === current);

  let predict, ratings = [], check = null;
  if (lg.sport === "football" && !lg.cup) {
    const model = fitPoisson(matches, NOW);
    if (model) {
      predict = (m) => footballMarkets(...expectedGoals(model, m.home, m.away));
      ratings = model.teams
        .filter((t) => currentMatches.some((m) => m.home === t || m.away === t))
        .map((t) => ({ team: t, attack: round(Math.exp(model.att[t]), 2), defence: round(Math.exp(model.def[t]), 2), rating: round(model.att[t] - model.def[t], 3) }))
        .sort((a, b) => b.rating - a.rating);
    }
    check = backtestFootball(matches);
  } else if (lg.sport === "football") {
    predict = (m) => footballMarkets(...eloToGoals(elo.rating(m.home, lg) + 60 - elo.rating(m.away, lg)));
    const teams = [...new Set(currentMatches.flatMap((m) => [m.home, m.away]))];
    ratings = teams.map((t) => ({ team: t, rating: Math.round(elo.rating(t, lg)) })).sort((a, b) => b.rating - a.rating);
  } else {
    const model = runEloBasketball(matches, lg.key);
    predict = (m) => model.predict(m.home, m.away);
    ratings = [...model.ratings].filter(([t]) => currentMatches.some((m) => m.home === t || m.away === t))
      .map(([team, r]) => ({ team, rating: Math.round(r) })).sort((a, b) => b.rating - a.rating);
  }

  const upcoming = matches
    .filter((m) => m.status === "NS" && Date.parse(m.kickoff) > NOW - 3 * 3600e3 && Date.parse(m.kickoff) < NOW + 21 * DAY)
    .map((m) => withWinner({ ...m, model: predict ? predict(m) : null }, lg.sport));
  const results = matches.filter((m) => m.status === "FT").map((m) => [m.id, m.kickoff, m.home, m.away, m.hs, m.as, m.season, m.round]);

  const out = {
    key: lg.key, name: lg.name, country: lg.country, sport: lg.sport, cup: !!lg.cup, source: data.source,
    fetchedAt: data.fetchedAt, season: current,
    table: lg.cup ? [] : table(currentMatches, lg.sport),
    ratings, upcoming, results, check,
  };
  await writeFile(new URL(`leagues/${lg.key}.json`, OUT), JSON.stringify(out));

  const next = upcoming[0];
  const last = results.at(-1);
  index.leagues.push({
    key: lg.key, name: lg.name, country: lg.country, sport: lg.sport, cup: !!lg.cup, featured: !!lg.featured,
    season: current, upcoming: upcoming.length, played: currentMatches.filter((m) => m.status === "FT").length,
    nextKickoff: next?.kickoff || null, lastResultAt: last?.[1] || null, fetchedAt: data.fetchedAt,
    check: check ? { matches: check.matches, hitRate: check.hitRate, brier: check.brier, baselineBrier: check.baselineBrier } : null,
  });
  for (const m of upcoming.filter((x) => Date.parse(x.kickoff) < NOW + 8 * DAY)) {
    index.upcoming.push({ ...m, league: lg.key, leagueName: lg.name, sport: lg.sport });
  }
  console.log(`${lg.name.padEnd(26)} ${String(currentMatches.length).padStart(4)} this season, ${String(upcoming.length).padStart(3)} upcoming${check ? `, check: ${check.matches} games, hit ${(check.hitRate * 100).toFixed(0)}%, Brier ${check.brier} vs ${check.baselineBrier}` : ""}`);
}
index.upcoming.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
index.winner = winnerRaw ? { fetchedAt: winnerRaw.fetchedAt, games: index.upcoming.filter((m) => m.winner).length, valueEdge: VALUE_EDGE } : null;

// Picks ledger
const picks = (await load(PICKS)) || [];
const leagueName = Object.fromEntries(LEAGUES.map((l) => [l.key, l.name]));
const record = buildRecord(picks.map((p) => ({ ...p, leagueName: leagueName[p.league] || p.league })), matchById);
index.record = record.summary;
await writeFile(new URL("record.json", OUT), JSON.stringify(record));
await writeFile(new URL("index.json", OUT), JSON.stringify(index));
console.log(`index: ${index.leagues.length} leagues, ${index.upcoming.length} fixtures in the next 8 days, ${record.summary.picks} picks in the ledger`);
