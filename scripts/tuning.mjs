// Self-tuning: once a week the model re-checks its own settings against the games it has
// logged and graded, keeps whatever would have predicted best, and writes every change to a
// public log. Three loops:
//
//  1. Settings: how fast old games fade (football half-life, by replaying past seasons) and how
//     much weight the model gets against Winner's prices (the blend).
//  2. Confidence: if our percentages run too hot or too cold, a "temperature" per sport tones
//     them down or sharpens them (p_i ∝ p_i^(1/T); T > 1 is humbler, T < 1 bolder).
//  3. Market moves: per league, does Winner's price move towards the model between our first
//     snapshot and kickoff? If it does, the model knows something and earns more weight there;
//     if the market keeps moving away, it gets less.
//
// Nothing changes until there's enough evidence (minimum sample sizes below).

export const DEFAULTS = { modelWeight: 0.35, halfLife: 180, temperature: { football: 1, basketball: 1 }, leagueWeight: {}, updatedAt: null, history: [] };
const MIN_GAMES = 150;        // graded games with Winner prices before touching the blend or temperature
const MIN_LEAGUE_GAMES = 40;  // per league, before adjusting its weight
const EVERY_MS = 6.5 * 86400e3;

export const temper = (p, T = 1) => {
  if (T === 1) return p;
  const q = p.map((x) => Math.max(x, 1e-6) ** (1 / T));
  const s = q.reduce((a, b) => a + b, 0);
  return q.map((x) => x / s);
};

const outcomeIndex = (m, n) => (n === 3 ? (m.hs > m.as ? 0 : m.hs === m.as ? 1 : 2) : m.hs > m.as ? 0 : 1);
const brier = (p, y) => p.reduce((s, x, i) => s + (x - (i === y ? 1 : 0)) ** 2, 0);
const logloss = (p, y) => -Math.log(Math.max(p[y], 1e-6));
const r3 = (x) => Math.round(x * 1000) / 1000;

// samples: graded games that have a probe { model, open, close } logged before kickoff.
function samplesFrom(entries, matchById, now) {
  const out = [];
  for (const e of entries) {
    if (!e.probe || Date.parse(e.kickoff) > Date.parse(now)) continue;
    const m = matchById.get(e.matchId);
    if (!m || m.status !== "FT" || m.hs == null) continue;
    const n = e.probe.model.length;
    if (n === 2 && m.hs === m.as) continue;
    out.push({ ...e.probe, sport: e.sport, league: e.league, y: outcomeIndex(m, n) });
  }
  return out;
}

export function maybeTune(tuning, { entries, matchById, now, backtestBrier }) {
  const t = { ...DEFAULTS, ...tuning, temperature: { ...DEFAULTS.temperature, ...tuning?.temperature }, leagueWeight: { ...tuning?.leagueWeight }, history: [...(tuning?.history ?? [])] };
  if (t.updatedAt && Date.parse(now) - Date.parse(t.updatedAt) < EVERY_MS) return { tuning: t, changed: false };
  const changes = [];
  const S = samplesFrom(entries, matchById, now);

  // Loop 2: confidence, per sport (model on its own).
  for (const sport of ["football", "basketball"]) {
    const s = S.filter((x) => x.sport === sport);
    if (s.length < MIN_GAMES) continue;
    let best = t.temperature[sport], bestL = Infinity;
    for (let T = 0.7; T <= 1.5001; T += 0.05) {
      const L = s.reduce((a, x) => a + logloss(temper(x.model, T), x.y), 0) / s.length;
      if (L < bestL) { bestL = L; best = r3(T); }
    }
    if (Math.abs(best - t.temperature[sport]) >= 0.05) {
      changes.push({ setting: `confidence (${sport})`, from: t.temperature[sport], to: best, games: s.length, why: best > 1 ? "our percentages ran too confident" : "our percentages were too timid" });
      t.temperature[sport] = best;
    }
  }

  // Loop 1b: the blend, using the closing market (the sharpest price we have).
  const withMarket = S.filter((x) => x.close);
  if (withMarket.length >= MIN_GAMES) {
    let best = t.modelWeight, bestB = Infinity;
    for (let w = 0; w <= 1.0001; w += 0.05) {
      const B = withMarket.reduce((a, x) => {
        const mp = temper(x.model, t.temperature[x.sport]);
        return a + brier(mp.map((p, i) => w * p + (1 - w) * x.close[i]), x.y);
      }, 0) / withMarket.length;
      if (B < bestB) { bestB = B; best = r3(w); }
    }
    best = Math.min(0.6, Math.max(0.1, best)); // never trust either side completely
    if (Math.abs(best - t.modelWeight) >= 0.05) {
      changes.push({ setting: "model weight vs Winner", from: t.modelWeight, to: best, games: withMarket.length, why: best > t.modelWeight ? "the model added more than we gave it credit for" : "Winner's prices predicted better" });
      t.modelWeight = best;
    }
  }

  // Loop 3: market moves, per league. Slope of (close - open) on (model - open), home/first outcome.
  const byLeague = {};
  for (const x of S.filter((s) => s.open && s.close)) (byLeague[x.league] ??= []).push(x);
  for (const [lg, s] of Object.entries(byLeague)) {
    if (s.length < MIN_LEAGUE_GAMES) continue;
    let num = 0, den = 0;
    for (const x of s) {
      const mp = temper(x.model, t.temperature[x.sport]);
      for (let i = 0; i < mp.length; i++) { const d = mp[i] - x.open[i]; num += d * (x.close[i] - x.open[i]); den += d * d; }
    }
    const slope = den ? num / den : 0;          // > 0: the market moves towards the model
    const w = r3(Math.min(0.6, Math.max(0.15, t.modelWeight * (0.6 + 2 * slope))));
    const old = t.leagueWeight[lg] ?? t.modelWeight;
    if (Math.abs(w - old) >= 0.05) {
      changes.push({ setting: `model weight (${lg})`, from: old, to: w, games: s.length, why: slope > 0.2 ? "Winner's prices tend to move towards our model here" : "Winner's prices tend to move away from our model here" });
      t.leagueWeight[lg] = w;
    }
  }

  // Loop 1a: football half-life, by replaying past seasons.
  if (backtestBrier) {
    let best = t.halfLife, bestB = backtestBrier(t.halfLife);
    for (const h of [90, 120, 180, 270, 365]) {
      if (h === t.halfLife) continue;
      const B = backtestBrier(h);
      if (B !== null && bestB !== null && B < bestB - 0.002) { bestB = B; best = h; }
    }
    if (best !== t.halfLife) {
      changes.push({ setting: "how fast old games fade (football)", from: `${t.halfLife} days`, to: `${best} days`, games: null, why: "replaying past seasons predicted better" });
      t.halfLife = best;
    }
  }

  t.updatedAt = now;
  t.history.push({ at: now, samples: S.length, changes });
  t.history = t.history.slice(-52);
  return { tuning: t, changed: changes.length > 0 };
}

// Probe logged with each game until kickoff: the raw model, and Winner's margin-free prices at
// our first look (open) and our latest look (close).
export function probeFor(m, prev) {
  const fb = !!m.model?.["1x2"];
  const model = fb ? [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]] : m.model?.win ? [m.model.win["1"], m.model.win["2"]] : null;
  if (!model) return prev ?? null;
  const o = m.winner?.odds;
  const fair = o && o.length === model.length ? (() => { const inv = o.map((x) => 1 / x); const s = inv.reduce((a, b) => a + b, 0); return inv.map((x) => r3(x / s)); })() : null;
  return { model: model.map(r3), open: prev?.open ?? fair, close: fair ?? prev?.close ?? null };
}
