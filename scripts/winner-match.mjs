// Winner's public line, parsed and matched to our fixtures. Pure functions, no I/O.
//
// Winner lists every game in Hebrew. We match each one to our English fixture by league, kickoff
// time (Israel time) and how the team names sound: both names are reduced to a consonant
// skeleton ("Maccabi Netanya" and "מכבי נתניה" both become MKBNTN) and compared.
// Pairs we confirm are kept as aliases, so a team only has to be matched by sound once.

export const WINNER_LEAGUES = [
  [240, /^ליגת Winner$/, "il-premier"],
  [240, /^פרמייר ליג$/, "epl"],
  [240, /^ספרדית ראשונה$/, "laliga"],
  [240, /^איטלקית ראשונה$/, "seriea"],
  [240, /^גרמנית ראשונה$/, "bundesliga"],
  [240, /^צרפתית ראשונה$/, "ligue1"],
  [240, /^הולנדית ראשונה$/, "eredivisie"],
  [240, /^פורטוגלית ראשונה$/, "primeira"],
  [240, /^צ'מפיונשיפ$/, "championship"],
  [240, /אלופות/, "ucl"],
  [240, /אירופית/, "uel"],
  [240, /קונפרנס/, "uecl"],
  [227, /^ליגת Winner סל$/, "il-basket"],
  [227, /^יורוליג$/, "euroleague"],
  [227, /^NBA$/, "nba"],
];

const leagueKey = (sId, league) => WINNER_LEAGUES.find(([s, re]) => s === sId && re.test(league))?.[2] ?? null;
const clean = (s) => String(s).replace(/[‎‏‪-‮]/g, "").trim();
const num = (s) => { const x = Number(s); return x > 1 ? x : null; };
const lineOf = (s) => { const m = /\(([-+]?\d+(?:\.\d+)?)\)/.exec(s); return m ? Number(m[1]) : null; };

// Winner's "e_date" is YYMMDD and "m_hour" is HHMM in Israel time; betting closes a minute
// before kickoff, so 18:59 means an 19:00 start.
function kickoffLocal(eDate, mHour) {
  const d = String(eDate).padStart(6, "0"), h = String(mHour).padStart(4, "0");
  let mins = Number(h.slice(0, 2)) * 60 + Number(h.slice(2)) + 1;
  return { date: `20${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`, mins };
}

// Turn the raw line into one record per game, keeping only the markets we price.
export function parseLine(markets) {
  const events = new Map();
  for (const m of markets) {
    const key = leagueKey(m.sId, clean(m.league));
    if (!key || m.isLive) continue;
    const mp = clean(m.mp);
    const [home, away] = clean(m.desc).split(" - ").map((s) => s.trim());
    if (!home || !away) continue;
    const ev = events.get(m.eId) ?? { id: m.eId, league: key, sport: m.sId === 240 ? "football" : "basketball", ...kickoffLocal(m.e_date, m.m_hour), home, away, odds: {} };
    events.set(m.eId, ev);
    const o = m.outcomes.map((x) => ({ desc: clean(x.desc), price: num(x.price) }));
    const fullTime = /תוצאת סיום|כולל הארכות|ללא הארכות/.test(mp) && !/מחצית|רבע/.test(mp);
    if (!fullTime) continue;
    if (/^1X2/.test(mp) && o.length === 3) ev.odds["1x2"] = o.map((x) => x.price);
    else if (/^הימור יתרון/.test(mp) && o.length === 3) ev.odds.hcap = { line: lineOf(o[0].desc), odds: o.map((x) => x.price) };
    else if (/^הימור יתרון/.test(mp) && o.length === 2) ev.odds.spread = { line: lineOf(o[0].desc), odds: o.map((x) => x.price) };
    else if (/^מעל\/מתחת (שערים|נקודות)/.test(mp) && o.length === 2) {
      const line = Number(/(\d+(?:\.\d+)?)/.exec(o[0].desc)?.[1]);
      const over = o.find((x) => x.desc.startsWith("מעל")), under = o.find((x) => x.desc.startsWith("מתחת"));
      if (line && over && under) ev.odds.total = { line, over: over.price, under: under.price };
    } else if (/^המנצח/.test(mp) && o.length === 2) ev.odds.ml = o.map((x) => x.price);
  }
  return [...events.values()].filter((e) => Object.keys(e.odds).length);
}

// ---------------------------------------------------------------------------------------------
// Sound-alike keys

const HE = { ב: "B", ג: "G", ד: "D", ז: "S", ח: "K", ט: "T", כ: "K", ך: "K", ל: "L", מ: "M", ם: "M", נ: "N", ן: "N", ס: "S", פ: "P", ף: "P", צ: "S", ץ: "S", ק: "K", ר: "R", ש: "S", ת: "T" };
const DROP_HE = /^(פ\.?צ\.?|אף\.?סי\.?|ס\.?ס\.?)$/;

export function heKey(s) {
  const words = clean(s).replace(/[״"]/g, "").split(/[\s\-]+/).filter((w) => w && !DROP_HE.test(w));
  let out = "";
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const c = w[i], next = w[i + 1];
      if (next === "'" || next === "׳") { out += c === "ג" ? "G" : c === "ז" ? "S" : c === "צ" ? "S" : c === "ת" ? "T" : (HE[c] ?? ""); i++; continue; }
      if (c === "ו") { if (next === "ו") { out += "B"; i++; } else if (i === 0) out += "B"; continue; }
      if (/\d/.test(c)) { out += c; continue; }
      out += HE[c] ?? "";
    }
  }
  return out.replace(/(.)\1+/g, "$1");
}

const EN_DROP = /^(fc|afc|cf|sc|bc|ac|as|ss|ssc|us|ud|cd|rc|rcd|sv|vfb|vfl|tsg|bsc|fsv|1|club|de|the|bk|kk|bc)$/;

export function enKey(s) {
  const words = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !EN_DROP.test(w));
  let out = "";
  for (const w0 of words) {
    const w = w0.replace(/sch/g, "s").replace(/ch/g, "s").replace(/sh/g, "s").replace(/th/g, "t").replace(/ph/g, "p")
      .replace(/ck/g, "k").replace(/kh/g, "k").replace(/gh/g, "g").replace(/t[sz]/g, "s").replace(/c(?=[eiy])/g, "s");
    for (const c of w) {
      out += /\d/.test(c) ? c : ({ b: "B", v: "B", w: "B", c: "K", k: "K", q: "K", g: "G", j: "G", d: "D", f: "P", p: "P", l: "L", m: "M", n: "N", r: "R", s: "S", z: "S", t: "T", x: "KS" })[c] ?? "";
    }
  }
  return out.replace(/(.)\1+/g, "$1");
}

function lcs(a, b) {
  const dp = Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

// 0..1: how alike a Hebrew and an English name sound. Short names inside longer ones count
// ("איינדהובן" for "PSV Eindhoven").
export function nameScore(he, en) {
  const a = heKey(he), b = enKey(en);
  if (!a || !b) return 0;
  const l = lcs(a, b);
  const dice = (2 * l) / (a.length + b.length);
  const inside = Math.min(a.length, b.length) >= 4 ? (0.92 * l) / Math.min(a.length, b.length) : 0;
  return Math.max(dice, inside);
}

// ---------------------------------------------------------------------------------------------
// Matching

const TZ = "Asia/Jerusalem";
const localFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
function localOf(iso) {
  const p = Object.fromEntries(localFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, mins: Number(p.hour) * 60 + Number(p.minute) };
}
const dayNum = (date) => Math.round(Date.parse(date + "T00:00:00Z") / 86400e3);
const minutesApart = (a, b) => Math.abs((dayNum(a.date) - dayNum(b.date)) * 1440 + a.mins - b.mins);

// aliases: { [league]: { [hebrew name]: english name } }, learned or set by hand.
// Returns [{ event, match, score }] plus newly learned aliases.
export function matchEvents(events, fixturesByLeague, aliases = {}) {
  const out = [], learned = {};
  const used = new Set();
  const teamScore = (lg, he, en) => (aliases[lg]?.[he] === en ? 1 : aliases[lg]?.[he] ? 0 : nameScore(he, en));
  // Cup sides come from every league, so look their names up everywhere.
  const anyAlias = (he) => { for (const lg of Object.values(aliases)) if (lg[he]) return lg[he]; return null; };
  const score = (lg, he, en) => { const s = teamScore(lg, he, en); if (s) return s; const a = anyAlias(he); return a ? (a === en ? 1 : 0) : 0; };

  for (const ev of events) {
    const fixtures = fixturesByLeague[ev.league] || [];
    const cands = fixtures
      .filter((m) => !used.has(m.id))
      .map((m) => {
        const t = minutesApart(ev, localOf(m.kickoff));
        const s = (score(ev.league, ev.home, m.home) + score(ev.league, ev.away, m.away)) / 2;
        return { m, t, s };
      })
      // Some sources only know the date, and games get moved, so the clock is a hint, not a gate.
      .filter((c) => c.t <= 26 * 60 || (c.s >= 0.85 && c.t <= 4 * 1440))
      .sort((a, b) => b.s - a.s || a.t - b.t);
    if (!cands.length) continue;
    const [best, second] = cands;
    const closeInTime = cands.filter((c) => c.t <= 20);
    const ok =
      best.s >= 0.72 ||
      (best.s >= 0.5 && (!second || best.s - second.s >= 0.15)) ||
      (best.s >= 0.6 && best.s - second.s >= 0.1) ||
      (closeInTime.length === 1 && closeInTime[0] === best && best.s >= 0.35);
    if (!ok) continue;
    used.add(best.m.id);
    out.push({ event: ev, match: best.m, score: Math.round(best.s * 100) / 100 });
    if (best.s >= 0.6) {
      (learned[ev.league] ??= {})[ev.home] = best.m.home;
      learned[ev.league][ev.away] = best.m.away;
    }
  }
  return { matched: out, learned };
}
