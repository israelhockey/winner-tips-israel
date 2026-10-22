import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { TeamMark, useTeamColor } from "./bits";
import { dayLabel, time, pct, fair } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import { isBasketModel, isFootballModel, type Match } from "@/lib/types";
import { useApp } from "@/lib/state";

// Text colour that reads on a club colour.
export const onColor = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? "#0D1B14" : "#FFFFFF";
};

export function chances(m: Match): number[] | null {
  if (m.winner?.p) return m.winner.p;
  if (isFootballModel(m.model)) return [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]];
  if (isBasketModel(m.model)) return [m.model.win["1"], m.model.win["2"]];
  return null;
}

// One game as a full stage: the screen split between the two clubs' colours at the point the
// odds put it, the draw a band between them. The split eases in from 50/50 when the stage is seen.
export function Stage({ m, onPicked, className = "", children, active: forced }: {
  m: Match; onPicked?: () => void; className?: string; children?: ReactNode; active?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const { legs, addLeg, removeLeg } = useApp();
  const sport = m.sport ?? (isBasketModel(m.model) ? "basketball" : "football");
  const homeC = useTeamColor(m.home, sport), awayC0 = useTeamColor(m.away, sport);
  const awayC = close(homeC, awayC0) ? "#14251C" : awayC0;
  const p = chances(m);
  const w = m.winner;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const on = forced ?? seen;

  if (!p) return null;
  const three = p.length === 3;
  const sels = three ? ["1", "X", "2"] : ["1", "2"];
  const market = three ? "1X2" : "Moneyline";
  const mine = legs.find((l) => l.matchId === m.id && l.market === market);
  const draw = three ? p[1] : 0;
  const mid = on ? (p[0] + draw / 2) * 100 : 50; // centre of the draw band, across the screen
  const half = on ? (draw * 100) / 2 : 0;
  const tilt = 7;
  const fav = p.indexOf(Math.max(...p));
  const homeInk = onColor(homeC), awayInk = onColor(awayC);
  const valueIdx = w?.edge ? w.edge.findIndex((e) => e >= VALUE_EDGE) : -1;

  const pick = (i: number) => {
    const s = sels[i], key = `${m.id}|${market}|${s}`;
    if (mine?.key === key) return removeLeg(key);
    addLeg({ key, matchId: m.id, league: m.league!, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market, selection: s,
      label: s === "1" ? m.home : s === "2" ? m.away : "Draw", modelP: p[i], odds: w?.odds?.[i] ?? null });
    onPicked?.();
  };

  const line = (() => {
    const name = fav === 0 ? m.home : fav === p.length - 1 ? m.away : "A draw";
    const strength = p[fav] >= 0.65 ? "big favourites" : p[fav] >= 0.5 ? "favourites" : "slight favourites in an open game";
    const base = fav === 1 && three ? `A draw is the likeliest result, at ${pct(p[1])}.` : `${name} are ${strength} at ${pct(p[fav])}.`;
    if (valueIdx >= 0) {
      const o = w!.odds![valueIdx];
      const who = sels[valueIdx] === "1" ? m.home : sels[valueIdx] === "2" ? m.away : "the draw";
      return `${base} Value on ${who}: Winner pays ${o.toFixed(2)}, the fair price is ${fair(p[valueIdx])}.`;
    }
    return w?.odds ? `${base} No value at Winner's prices on this one.` : base;
  })();

  return (
    <section ref={ref} className={`relative isolate flex flex-col overflow-hidden ${className}`} style={{ background: awayC }}>
      {/* the split */}
      <div className="absolute inset-0 -z-10 transition-[clip-path] duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ background: homeC, clipPath: `polygon(0 0, ${mid - half + tilt}% 0, ${mid - half - tilt}% 100%, 0 100%)` }} />
      {three && (
        <div className="stage-draw absolute inset-0 -z-10 transition-[clip-path] duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ clipPath: `polygon(${mid - half + tilt}% 0, ${mid + half + tilt}% 0, ${mid + half - tilt}% 100%, ${mid - half - tilt}% 100%)` }} />
      )}
      <div className="stage-grain absolute inset-0 -z-10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      {/* top line */}
      <div className="relative mx-auto flex w-full max-w-page items-center justify-between gap-3 px-4 pt-5 text-sm md:px-8" style={{ color: homeInk }}>
        <span className="rounded-full bg-black/25 px-3 py-1 font-semibold text-white backdrop-blur-sm">{m.leagueName} · {dayLabel(m.kickoff)} {time(m.kickoff)}</span>
        {valueIdx >= 0 && <span className="stage-glow rounded-full bg-[#4ADE80] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink">Value</span>}
      </div>
      {children}

      {/* the clubs */}
      <Link to={`/match/${m.league}/${m.id}`} className="relative mx-auto grid w-full max-w-page flex-1 grid-cols-2 items-center gap-4 px-4 md:px-8">
        <Side name={m.home} he={w?.he[0]} p={p[0]} ink={homeInk} sport={sport} on={on} />
        <Side name={m.away} he={w?.he[1]} p={p[p.length - 1]} ink={awayInk} sport={sport} on={on} right />
        {three && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white">
            <span className="block font-display text-sm font-bold uppercase tracking-[0.3em] opacity-80">Draw</span>
            <span className="num block font-display text-3xl font-extrabold">{Math.round(p[1] * 100)}%</span>
          </span>
        )}
      </Link>

      {/* the coupon */}
      <div className="relative mx-auto w-full max-w-3xl px-4 pb-6 md:pb-10">
        <p className="mb-4 text-center text-sm leading-relaxed text-white/90 md:text-base">{line}</p>
        <div className={`grid gap-2.5 ${three ? "grid-cols-3" : "grid-cols-2"}`}>
          {p.map((x, i) => {
            const picked = mine?.selection === sels[i];
            const o = w?.odds?.[i] ?? null;
            const value = (w?.edge?.[i] ?? -1) >= VALUE_EDGE;
            return (
              <button key={i} type="button" data-sel={sels[i]} onClick={() => pick(i)} aria-pressed={picked}
                aria-label={`${sels[i] === "1" ? m.home : sels[i] === "2" ? m.away : "Draw"}: our chance ${pct(x)}, ${o ? `Winner pays ${o.toFixed(2)}` : `fair price ${fair(x)}`}`}
                className={`group relative overflow-hidden rounded-md bg-white px-3 py-3 text-left text-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5 active:translate-y-0 md:px-4 md:py-4
                  ${value ? "stage-glow ring-4 ring-[#4ADE80]" : ""}`}>
                {picked && <span className="mark-in absolute inset-1.5 rounded bg-marker" />}
                <span className="relative flex items-start justify-between">
                  <span className="font-display text-3xl font-extrabold leading-none md:text-4xl">{sels[i]}</span>
                  {picked ? <Check className="text-ink" size={22} strokeWidth={3} /> : value ? <span className="rounded-sm bg-won px-1 text-[10px] font-bold uppercase text-white">Value</span> : null}
                </span>
                <span className="relative mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
                  <span className="num font-display text-2xl font-extrabold leading-none md:text-3xl">{o ? o.toFixed(2) : fair(x)}</span>
                  <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-ink-muted sm:text-right">{o ? "Winner" : "Fair"}<span className="sm:hidden"> · </span><br className="hidden sm:block" />{pct(x)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Side({ name, he, p, ink, sport, on, right }: { name: string; he?: string; p: number; ink: string; sport: string; on: boolean; right?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 ${right ? "items-end text-right" : "items-start"}`} style={{ color: ink }}>
      <span className={`grid place-items-center rounded-full bg-white/95 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] transition-transform duration-700 md:p-5 ${on ? "scale-100" : "scale-90"}`}>
        <TeamMark name={name} sport={sport} size={64} />
      </span>
      <span className="font-display text-[2rem] font-extrabold leading-[0.9] [overflow-wrap:anywhere] sm:text-5xl md:text-6xl">{name}</span>
      {he && <span dir="rtl" lang="he" className="text-sm opacity-75 md:text-base">{he}</span>}
      <span className="num font-display text-6xl font-extrabold leading-none md:text-8xl" style={{ opacity: on ? 1 : 0, transition: "opacity .8s .3s" }}>
        {Math.round(p * 100)}<span className="text-[0.45em]">%</span>
      </span>
    </div>
  );
}

function close(a: string, b: string) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 90;
}
