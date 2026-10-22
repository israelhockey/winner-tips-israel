import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { useIndex } from "@/lib/data";
import { dayLabel, time, fair, pct, signedPct, ago } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import { useApp } from "@/lib/state";
import { Loading, TeamMark } from "@/components/bits";
import type { Match } from "@/lib/types";

// Every bet Winner offers on the games we cover, checked against our numbers.
interface Row { key: string; m: Match; market: string; line: number | null; sel: string; label: string; odds: number; p: number; edge: number }

const betName = (r: Row) => `${r.label}${r.market === "1X2" || r.market === "Winner" ? (r.sel === "X" ? "" : " to win") : ""}`;
const marketName = (r: Row) => r.market === "1X2" ? "Result" : r.market === "Goals" ? "Total goals" : r.market === "Points" ? "Total points" : r.market === "Winner" ? "Winner" : "Handicap";

export default function Value() {
  const { data: index } = useIndex();
  const [league, setLeague] = useState("all");
  const [onlyValue, setOnlyValue] = useState(true);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const m of index?.upcoming ?? []) {
      if (!m.winner || Date.parse(m.kickoff) < Date.now()) continue;
      for (const x of m.winner.markets) x.sels.forEach((sel, i) => out.push({ key: `${m.id}|W${x.market}${x.line ?? ""}|${sel}`, m, market: x.market, line: x.line, sel, label: x.labels[i], odds: x.odds[i], p: x.p[i], edge: x.edge[i] }));
    }
    return out.sort((a, b) => b.edge - a.edge);
  }, [index]);

  const games = useMemo(() => (index?.upcoming ?? []).filter((m) => m.winner), [index]);
  const avgMargin = games.length ? games.reduce((s, m) => s + m.winner!.margin, 0) / games.length : 0;
  const leagues = useMemo(() => [...new Map(rows.map((r) => [r.m.league!, r.m.leagueName!])).entries()], [rows]);
  const inLeague = rows.filter((r) => league === "all" || r.m.league === league);
  const value = inLeague.filter((r) => r.edge >= VALUE_EDGE);
  const allValue = rows.filter((r) => r.edge >= VALUE_EDGE);
  const shown = onlyValue ? (value.length ? value : inLeague.slice(0, 10)) : inLeague.slice(0, 150);
  // The three best prices, one per game: value first, topped up with the closest.
  const top = rows.filter((r, i, a) => a.findIndex((x) => x.m.id === r.m.id) === i).slice(0, 3);

  return (
    <>
      {/* Hero: the desk */}
      <section className="bleed relative -mt-12 overflow-hidden bg-ink text-white">
        <Grid />
        <div className="relative mx-auto max-w-page px-4 pb-14 pt-12 md:px-6 md:pt-16">
          <p className="font-display text-lg font-bold text-marker">Value finder</p>
          <h1 className="mt-2 max-w-3xl font-display text-[2.8rem] font-extrabold leading-[0.95] sm:text-6xl">Where Winner is paying more than it should.</h1>
          <p className="mt-5 max-w-2xl text-white/75">
            We read every price on Winner's coupon for the games we cover, put a fair price on each one, and flag the bets where Winner pays at least {pct(VALUE_EDGE)} too much.
          </p>
          {index?.winner && (
            <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
              <Stat n={String(allValue.length)} label="value bets right now" tone="text-[#4ADE80]" />
              <Stat n={rows[0] ? `${rows[0].edge > 0 ? "+" : ""}${Math.round(rows[0].edge * 100)}%` : "–"} label="best edge" />
              <Stat n={pct(avgMargin)} label="Winner's average margin" />
              <Stat n={String(rows.length)} label={`prices checked, ${ago(index.winner.fetchedAt)}`} />
            </dl>
          )}
        </div>
      </section>

      {!index ? <Loading what="Winner's odds" /> : !index.winner ? (
        <p className="mt-10 panel p-6 muted">Winner's odds aren't loaded yet. They arrive with the next data update, within three hours.</p>
      ) : (
        <>
          {/* Top value, as printed tickets */}
          <section className="bleed bg-pitch-deep">
            <div className="mx-auto max-w-page px-4 pb-12 pt-10 md:px-6">
              <h2 className="font-display text-2xl font-extrabold text-white">{allValue.length ? "Best prices right now" : "Closest to value right now"}</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {top.map((r, i) => <ValueTicket key={r.key} r={r} delay={i * 0.08} />)}
              </div>
            </div>
          </section>

          {/* The chart */}
          <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-center">
            <Scatter rows={rows} />
            <div>
              <h2 className="h2">Every price, checked</h2>
              <p className="mt-3 leading-relaxed text-ink-muted">
                Each dot is one bet on Winner. Across is the chance Winner's price implies; up is the chance we give it.
                On the dashed line the price is exactly fair. Most dots sit just below it: that gap is Winner's margin.
              </p>
              <p className="mt-3 leading-relaxed text-ink-muted">
                Dots in the <span className="font-semibold text-won">green zone</span> are value: we rate the bet at least {pct(VALUE_EDGE)} likelier than Winner's price says. Point at one to see the bet.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-faint">
                Value isn't a guarantee. Our model can't see injuries or team news, so check the line-ups before you play. Odds on Winner move.
              </p>
            </div>
          </section>

          {/* The list */}
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="h2">All the prices</h2>
              <div className="inline-flex rounded border border-line bg-card p-0.5 text-sm" role="tablist">
                <button role="tab" aria-selected={onlyValue} onClick={() => setOnlyValue(true)} className={`rounded-sm px-3 py-1.5 font-semibold ${onlyValue ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}>Value bets ({value.length})</button>
                <button role="tab" aria-selected={!onlyValue} onClick={() => setOnlyValue(false)} className={`rounded-sm px-3 py-1.5 font-semibold ${!onlyValue ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}>Every bet</button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={`chip ${league === "all" ? "chip-on" : ""}`} onClick={() => setLeague("all")}>All leagues</button>
              {leagues.map(([k, n]) => <button key={k} className={`chip ${league === k ? "chip-on" : ""}`} onClick={() => setLeague(k)}>{n}</button>)}
            </div>
            {onlyValue && !value.length && (
              <p className="mt-4 rounded border border-line bg-well px-4 py-3 text-sm">
                No bet here clears the {pct(VALUE_EDGE)} bar right now. That's normal: with Winner's margin, value is rare. These are the closest.
              </p>
            )}
            <div className="mt-4 panel divide-y divide-line">
              {shown.map((r) => <PriceRow key={r.key} r={r} />)}
            </div>
            <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">
              Odds are read from Winner's public site every three hours and can change at any time; always check the price on Winner before you play.
              We're not affiliated with Winner or the Israel Sports Betting Board.
            </p>
          </section>
        </>
      )}
    </>
  );
}

function Stat({ n, label, tone = "text-white" }: { n: string; label: string; tone?: string }) {
  return (
    <div>
      <dd className={`num font-display text-4xl font-extrabold leading-none md:text-5xl ${tone}`}>{n}</dd>
      <dt className="mt-1.5 text-sm text-white/60">{label}</dt>
    </div>
  );
}

// Faint graph-paper behind the hero.
function Grid() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id="vgrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#FFFFFF" strokeOpacity="0.05" /></pattern>
        <linearGradient id="vfade" x1="0" x2="1"><stop offset="0.35" stopColor="#0D1B14" stopOpacity="1" /><stop offset="1" stopColor="#0D1B14" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#vgrid)" />
      <rect width="100%" height="100%" fill="url(#vfade)" />
      <line x1="55%" y1="100%" x2="100%" y2="5%" stroke="#4ADE80" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 8" />
    </svg>
  );
}

// A top value bet as a printed ticket.
function ValueTicket({ r, delay }: { r: Row; delay: number }) {
  const { addLeg, hasLeg, removeLeg } = useApp();
  const on = hasLeg(r.key);
  const good = r.edge >= VALUE_EDGE;
  const sport = r.m.sport ?? "football";
  const fairOdds = 1 / r.p;
  return (
    <div className="coupon print-in rounded-[3px] p-5 text-ink" style={{ animationDelay: `${delay}s`, transform: "none" }}>
      <div className="flex items-center justify-between text-[11px] text-ink-faint">
        <span>{r.m.leagueName} · {dayLabel(r.m.kickoff)} {time(r.m.kickoff)}</span>
        <span className={`num rounded-sm px-1.5 py-0.5 text-xs font-bold ${good ? "bg-won text-white" : "bg-well text-ink-muted"}`}>{signedPct(r.edge)}</span>
      </div>
      <Link to={`/match/${r.m.league}/${r.m.id}`} className="mt-3 block space-y-1.5 hover:underline">
        {[r.m.home, r.m.away].map((n) => (
          <span key={n} className="flex items-center gap-2 font-semibold"><TeamMark name={n} sport={sport} size={22} /><span className="truncate">{n}</span></span>
        ))}
      </Link>
      <div className="mt-4 border-t-2 border-dashed border-line pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{marketName(r)}</div>
        <div className="mt-0.5 font-display text-xl font-extrabold leading-tight">{betName(r)}</div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Winner pays</div>
            <div className="num font-display text-5xl font-extrabold leading-none">{r.odds.toFixed(2)}</div>
          </div>
          <div className="text-right text-sm">
            <div className="text-ink-muted">Fair price <span className="num font-semibold text-ink">{fairOdds.toFixed(2)}</span></div>
            <div className="text-ink-muted">Our chance <span className="num font-semibold text-ink">{pct(r.p)}</span></div>
          </div>
        </div>
        <EdgeBar odds={r.odds} fairOdds={fairOdds} />
        <button className={`mt-4 w-full ${on ? "btn-primary" : "btn-marker"}`} aria-pressed={on}
          onClick={() => on ? removeLeg(r.key) : addLeg({ key: r.key, matchId: r.m.id, league: r.m.league!, event: `${r.m.home} v ${r.m.away}`, kickoff: r.m.kickoff, market: r.market, selection: r.sel, label: r.label, modelP: r.p, odds: r.odds })}>
          {on ? <><Check size={16} /> On your ticket</> : <><Plus size={16} /> Add to ticket</>}
        </button>
      </div>
    </div>
  );
}

// Winner's price against the fair price on one scale.
function EdgeBar({ odds, fairOdds }: { odds: number; fairOdds: number }) {
  const lo = Math.min(odds, fairOdds) * 0.85, hi = Math.max(odds, fairOdds) * 1.12;
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const good = odds > fairOdds;
  return (
    <div className="relative mt-4 h-8" aria-hidden>
      <div className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-well" />
      <div className={`absolute top-3 h-1.5 rounded-full ${good ? "bg-won" : "bg-lost/60"}`} style={{ left: `${Math.min(x(odds), x(fairOdds))}%`, width: `${Math.abs(x(odds) - x(fairOdds))}%` }} />
      <span className="absolute top-1.5 h-4 w-0.5 bg-ink-faint" style={{ left: `${x(fairOdds)}%` }} />
      <span className="absolute top-[22px] -translate-x-1/2 text-[9px] font-semibold uppercase text-ink-faint" style={{ left: `${x(fairOdds)}%` }}>fair</span>
      <span className="absolute top-1 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-card bg-ink shadow" style={{ left: `${x(odds)}%` }} />
    </div>
  );
}

// Every Winner price: implied chance across, our chance up. Above the line is value.
function Scatter({ rows }: { rows: Row[] }) {
  const [hover, setHover] = useState<Row | null>(null);
  const W = 640, H = 440, P = 44;
  const X = (v: number) => P + v * (W - P - 16), Y = (v: number) => H - P - v * (H - P - 16);
  const pts = rows.filter((r) => r.odds > 1);
  const zone = Array.from({ length: 21 }, (_, i) => i / 20).map((v) => `${X(v)},${Y(Math.min(1, v * (1 + VALUE_EDGE)))}`).join(" ");
  return (
    <figure className="panel relative p-3 sm:p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Winner's implied chance against our chance for every bet">
        <polygon points={`${X(0)},${Y(0)} ${zone} ${X(1 / (1 + VALUE_EDGE))},${Y(1)} ${X(0)},${Y(1)}`} fill="#17905A" fillOpacity="0.08" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(1)} stroke="#D2DAD3" />
            <line x1={X(0)} x2={X(1)} y1={Y(t)} y2={Y(t)} stroke="#D2DAD3" />
            <text x={X(t)} y={H - P + 18} fontSize="11" fill="#8A988F" textAnchor="middle">{t * 100}%</text>
            <text x={P - 8} y={Y(t) + 4} fontSize="11" fill="#8A988F" textAnchor="end">{t * 100}%</text>
          </g>
        ))}
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="#55665C" strokeDasharray="4 5" />
        <text x={X(0.06)} y={Y(0.86)} fontSize="13" fontWeight="700" fill="#17905A">Value zone</text>
        <text x={X(0.7)} y={Y(0.62)} fontSize="11" fill="#55665C" transform={`rotate(-33 ${X(0.7)} ${Y(0.62)})`}>fair price</text>
        <text x={(X(0) + X(1)) / 2} y={H - 6} fontSize="11" fill="#55665C" textAnchor="middle">Chance Winner's price implies</text>
        <text x={12} y={(Y(0) + Y(1)) / 2} fontSize="11" fill="#55665C" textAnchor="middle" transform={`rotate(-90 12 ${(Y(0) + Y(1)) / 2})`}>Our chance</text>
        {pts.map((r) => {
          const good = r.edge >= VALUE_EDGE;
          return (
            <circle key={r.key} cx={X(1 / r.odds)} cy={Y(r.p)} r={good ? 6 : 3.5}
              fill={good ? "#17905A" : "#8A988F"} fillOpacity={good ? 0.95 : 0.45} stroke={hover === r ? "#0D1B14" : good ? "#FFFFFF" : "none"} strokeWidth={hover === r ? 2 : 1.5}
              onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)} onClick={() => setHover(r)} className="cursor-pointer" />
          );
        })}
      </svg>
      <figcaption className="mt-2 min-h-[3.25rem] rounded bg-well px-3 py-2 text-sm">
        {hover ? (
          <>
            <span className="font-semibold">{betName(hover)}</span> <span className="text-ink-muted">· {hover.m.home} v {hover.m.away}</span>
            <span className="num block text-ink-muted">Winner pays {hover.odds.toFixed(2)} ({pct(1 / hover.odds)}); we make it {pct(hover.p)} · <span className={hover.edge >= VALUE_EDGE ? "font-semibold text-won" : ""}>{signedPct(hover.edge)}</span></span>
          </>
        ) : <span className="text-ink-faint">Point at a dot to see the bet. {pts.length} prices from {new Set(pts.map((r) => r.m.id)).size} games.</span>}
      </figcaption>
    </figure>
  );
}

// One price in the list, with an edge bar centred on fair.
function PriceRow({ r }: { r: Row }) {
  const { addLeg, hasLeg, removeLeg } = useApp();
  const on = hasLeg(r.key);
  const good = r.edge >= VALUE_EDGE;
  const sport = r.m.sport ?? "football";
  const w = Math.min(50, Math.abs(r.edge) * 200);
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_5rem_9rem_auto] ${good ? "bg-won/5" : ""}`}>
      <div className="min-w-0">
        <div className="text-[11px] text-ink-faint">{r.m.leagueName} · {dayLabel(r.m.kickoff)} {time(r.m.kickoff)}</div>
        <Link to={`/match/${r.m.league}/${r.m.id}`} className="flex items-center gap-1.5 font-semibold hover:text-accent">
          <TeamMark name={r.m.home} sport={sport} size={18} /><span className="truncate">{r.m.home}</span>
          <span className="text-ink-faint">v</span>
          <TeamMark name={r.m.away} sport={sport} size={18} /><span className="truncate">{r.m.away}</span>
        </Link>
      </div>
      <div className="col-start-1 min-w-0 md:col-start-auto">
        <div className="truncate text-sm">{betName(r)}</div>
        <div className="text-[11px] text-ink-faint">{marketName(r)} · our chance {pct(r.p)} · fair {fair(r.p)}</div>
      </div>
      <div className="row-start-1 text-right md:row-start-auto">
        <div className="num font-display text-2xl font-extrabold leading-none">{r.odds.toFixed(2)}</div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">Winner</div>
      </div>
      <div className="hidden md:block">
        <div className="relative h-2 rounded-full bg-well">
          <span className="absolute left-1/2 top-[-3px] h-[14px] w-px bg-ink-faint" />
          <span className={`absolute top-0 h-2 rounded-full ${good ? "bg-won" : r.edge >= 0 ? "bg-ink-faint" : "bg-lost/40"}`}
            style={r.edge >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} />
        </div>
        <div className={`num mt-1 text-center text-xs ${good ? "font-bold text-won" : "text-ink-faint"}`}>{signedPct(r.edge)}</div>
      </div>
      <div className="row-start-2 flex items-center justify-end gap-2 md:row-start-auto">
        <span className={`num text-xs md:hidden ${good ? "font-bold text-won" : "text-ink-faint"}`}>{signedPct(r.edge)}</span>
        <button className={`chip ${on ? "chip-on" : ""}`} aria-pressed={on}
          onClick={() => on ? removeLeg(r.key) : addLeg({ key: r.key, matchId: r.m.id, league: r.m.league!, event: `${r.m.home} v ${r.m.away}`, kickoff: r.m.kickoff, market: r.market, selection: r.sel, label: r.label, modelP: r.p, odds: r.odds })}>
          {on ? <Check size={12} /> : <Plus size={12} />} Ticket
        </button>
      </div>
    </div>
  );
}
