import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ChevronUp, ChevronDown } from "lucide-react";
import { useIndex } from "@/lib/data";
import { useApp } from "@/lib/state";
import { VALUE_EDGE } from "@/lib/config";
import { Stage, chances } from "@/components/Stage";
import { TeamMark } from "@/components/bits";
import { Mark } from "@/components/Layout";
import { dayLabel, time } from "@/lib/format";
import type { Match } from "@/lib/types";

// Matchday: the coupon as a full-screen experience. One game per screen, split in the clubs'
// colours by the odds; mark 1, X or 2 and it moves on to the next game.
const FILTERS = [
  { key: "top", label: "Top games", test: (m: Match) => ["il-premier", "il-basket", "ucl", "uel", "uecl", "epl", "laliga", "seriea", "bundesliga", "euroleague"].includes(m.league!) },
  { key: "israel", label: "Israel", test: (m: Match) => m.league === "il-premier" || m.league === "il-basket" },
  { key: "football", label: "Football", test: (m: Match) => m.sport === "football" },
  { key: "basketball", label: "Basketball", test: (m: Match) => m.sport === "basketball" },
  { key: "value", label: "Value", test: (m: Match) => !!m.winner?.edge?.some((e) => e >= VALUE_EDGE) },
  { key: "all", label: "Everything", test: () => true },
];

export default function Matchday() {
  const { data: index } = useIndex();
  const { legs } = useApp();
  const [filter, setFilter] = useState("top");
  const [current, setCurrent] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const games = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return (index?.upcoming ?? [])
      .filter((m) => chances(m) && Date.parse(m.kickoff) > Date.now() - 2 * 3600e3 && Date.parse(m.kickoff) < Date.now() + 4 * 86400e3 && f.test(m))
      .slice(0, 40);
  }, [index, filter]);
  const screens = games.length + 2; // intro, games, finish
  const picked = new Set(legs.map((l) => l.matchId));
  const combined = legs.reduce((a, l) => a * (l.odds ?? 1 / (l.modelP ?? 1)), 1);

  const go = (i: number) => {
    const el = box.current;
    if (el) el.scrollTo({ top: Math.max(0, Math.min(screens - 1, i)) * el.clientHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const on = () => setCurrent(Math.round(el.scrollTop / el.clientHeight));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === "arrowdown" || k === "j" || k === "pagedown") { e.preventDefault(); go(current + 1); }
      else if (k === "arrowup" || k === "k" || k === "pageup") { e.preventDefault(); go(current - 1); }
      else if (["1", "x", "2"].includes(k) && current >= 1 && current <= games.length) {
        box.current?.querySelector<HTMLButtonElement>(`[data-stage="${current - 1}"] button[data-sel="${k.toUpperCase()}"]`)?.click();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  useEffect(() => { box.current?.scrollTo({ top: 0 }); }, [filter]);

  return (
    <div className="relative">
      <div ref={box} className="no-scrollbar h-[calc(100svh-4rem)] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-ink">
        {/* intro */}
        <section className="relative flex h-full snap-start flex-col justify-center overflow-hidden bg-ink px-4 text-white md:px-8">
          <IntroBackdrop games={games} />
          <div className="relative mx-auto w-full max-w-page">
            <div className="flex items-center gap-3"><Mark size={44} onDark /><span className="font-display text-xl font-bold text-marker">Matchday</span></div>
            <h1 className="mt-6 max-w-4xl font-display text-[3.2rem] font-extrabold leading-[0.88] sm:text-7xl lg:text-[7rem]">
              {index ? <>{games.length} games.<br />One coupon.<br /><span className="text-marker">Yours to fill.</span></> : "Loading the coupon…"}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              Each game takes the whole screen, split in the clubs' colours by how likely each one is to win. Mark 1, X or 2 and the next game rolls in.
              Green means Winner is paying more than it should.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button className="btn-marker px-6 py-3.5 text-base" onClick={() => go(1)} disabled={!games.length}>Start <ArrowDown size={18} /></button>
              <span className="hidden text-sm text-white/55 md:inline">Keys: <Kbd>1</Kbd> <Kbd>X</Kbd> <Kbd>2</Kbd> to mark, <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
            </div>
          </div>
        </section>

        {games.map((m, i) => (
          <div key={m.id} data-stage={i} className="h-full snap-start">
            <Stage m={m} className="h-full pb-14 pt-11" onPicked={() => window.setTimeout(() => go(i + 2), 650)} />
          </div>
        ))}

        {/* finish */}
        <section className="flex h-full snap-start flex-col justify-center bg-paper px-4 md:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <p className="font-display text-xl font-bold text-accent">Full time</p>
            <h2 className="mt-2 font-display text-5xl font-extrabold leading-none md:text-7xl">
              {legs.length ? `Your coupon: ${legs.length} pick${legs.length === 1 ? "" : "s"}` : "Nothing marked yet"}
            </h2>
            {legs.length > 0 ? (
              <>
                <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-card">
                  {legs.slice(-6).map((l) => (
                    <li key={l.key} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="min-w-0"><span className="block truncate font-semibold">{l.label}{l.selection === "X" ? "" : " to win"}</span><span className="block truncate text-xs text-ink-muted">{l.event} · {dayLabel(l.kickoff)} {time(l.kickoff)}</span></span>
                      <span className="num font-display text-2xl font-extrabold">{l.odds ? l.odds.toFixed(2) : "–"}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link to="/ticket" className="btn-primary px-6 py-3.5 text-base">Open your ticket</Link>
                  <span className="text-sm text-ink-muted">Combined odds <b className="num text-ink">{combined.toFixed(2)}</b>. Check every price on Winner before you play.</span>
                </div>
              </>
            ) : <p className="mt-6 max-w-xl text-lg text-ink-muted">Scroll back up and tap a 1, X or 2 on any game to start your coupon.</p>}
            <button className="mt-10 text-sm font-semibold text-accent underline underline-offset-4" onClick={() => go(0)}>Back to the start</button>
          </div>
        </section>
      </div>

      {/* filters */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
        <div className="no-scrollbar pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full bg-black/45 p-1 backdrop-blur-md">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === f.key ? "bg-white text-ink" : "text-white/80 hover:text-white"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* progress rail */}
      <nav className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-1.5 md:flex" aria-label="Games">
        <button onClick={() => go(current - 1)} className="mb-1 rounded-full bg-black/35 p-1 text-white hover:bg-black/55" aria-label="Previous"><ChevronUp size={16} /></button>
        {games.map((m, i) => (
          <button key={m.id} onClick={() => go(i + 1)} aria-label={`${m.home} v ${m.away}`}
            className={`h-2 w-2 rounded-full transition-all ${current === i + 1 ? "h-5 bg-white" : picked.has(m.id) ? "bg-marker" : "bg-white/40 hover:bg-white/70"}`} />
        ))}
        <button onClick={() => go(current + 1)} className="mt-1 rounded-full bg-black/35 p-1 text-white hover:bg-black/55" aria-label="Next"><ChevronDown size={16} /></button>
      </nav>

      {/* running coupon */}
      {legs.length > 0 && current > 0 && current <= games.length && (
        <Link to="/ticket" className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink/90 py-1.5 pl-2 pr-4 text-sm text-white shadow-xl backdrop-blur hover:bg-ink">
          <span className="flex -space-x-1.5">
            {legs.slice(-3).map((l) => <span key={l.key} className="rounded-full bg-white p-0.5"><TeamMark name={l.selection === "2" ? l.event.split(" v ")[1] : l.event.split(" v ")[0]} size={18} /></span>)}
          </span>
          <span><b>{legs.length}</b> on your coupon · odds <b className="num text-marker">{combined.toFixed(2)}</b></span>
        </Link>
      )}
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-sans text-xs text-white">{children}</kbd>;
}

// The intro's backdrop: the coupon's games as thin colour bars, like a stadium board.
function IntroBackdrop({ games }: { games: Match[] }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 flex-col justify-center gap-2 pr-10 opacity-50 lg:flex" aria-hidden>
      {games.slice(0, 14).map((m, i) => {
        const p = chances(m)!;
        return (
          <div key={m.id} className="flex h-3 overflow-hidden rounded-full" style={{ marginLeft: `${(i % 4) * 6}%`, animation: `print .8s ${i * 0.05}s both` }}>
            <span className="bg-white" style={{ width: `${p[0] * 100}%` }} />
            {p.length === 3 && <span className="bg-white/25" style={{ width: `${p[1] * 100}%` }} />}
            <span className="bg-marker" style={{ width: `${p[p.length - 1] * 100}%` }} />
          </div>
        );
      })}
    </div>
  );
}
