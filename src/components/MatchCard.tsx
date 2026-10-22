import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { TeamMark, useTeamColor } from "./bits";
import { onColor } from "./Stage";
import { fair, time, pct } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import { isBasketModel, isFootballModel, type Match } from "@/lib/types";
import { useApp } from "@/lib/state";

// One game as a card: a small stage split in the two clubs' colours where the odds put it,
// with both crests and chances on it, then Winner's odds to tap onto the ticket.
export function MatchCard({ m, leagueKey, showLeague = false }: { m: Match; leagueKey: string; showLeague?: boolean }) {
  const { addLeg, legs, removeLeg } = useApp();
  const sport = m.sport ?? (isBasketModel(m.model) ? "basketball" : "football");
  const fm = isFootballModel(m.model) ? m.model : null;
  const bm = isBasketModel(m.model) ? m.model : null;
  const w = m.winner;
  const p = w?.p ?? (fm ? [fm["1x2"]["1"], fm["1x2"].X, fm["1x2"]["2"]] : bm ? [bm.win["1"], bm.win["2"]] : null);
  const sels = p?.length === 3 ? ["1", "X", "2"] : ["1", "2"];
  const market = p?.length === 3 ? "1X2" : "Moneyline";
  const mine = legs.find((l) => l.matchId === m.id && l.market === market);
  const homeC = useTeamColor(m.home, sport), awayRaw = useTeamColor(m.away, sport);
  const awayC = similar(homeC, awayRaw) ? "#14251C" : awayRaw; // two red clubs still need two sides
  const valueIdx = w?.edge ? w.edge.findIndex((e) => e >= VALUE_EDGE) : -1;
  const fav = p ? p.indexOf(Math.max(...p)) : -1;

  const pick = (i: number) => {
    if (!p) return;
    const s = sels[i], key = `${m.id}|${market}|${s}`;
    if (mine?.key === key) return removeLeg(key);
    addLeg({ key, matchId: m.id, league: leagueKey, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market, selection: s,
      label: s === "1" ? m.home : s === "2" ? m.away : "Draw", modelP: p[i], odds: w?.odds?.[i] ?? null });
  };

  const meta = fm ? `xG ${fm.xg[0].toFixed(1)}–${fm.xg[1].toFixed(1)}`
    : bm ? `${bm.spread > 0 ? m.home.split(" ").at(-1) : m.away.split(" ").at(-1)} by ${Math.abs(bm.spread).toFixed(1)}${bm.total ? ` · ${bm.total.toFixed(0)} pts` : ""}` : "";

  // Where the split falls: the middle of the draw band.
  const draw = p?.length === 3 ? p[1] : 0;
  const mid = p ? (p[0] + draw / 2) * 100 : 50, half = draw * 50, tilt = 9;

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-card bg-card shadow-[0_1px_0_rgba(13,27,20,0.06),0_14px_34px_-24px_rgba(13,27,20,0.55)] ring-1 transition-transform duration-300 hover:-translate-y-1
      ${valueIdx >= 0 ? "ring-2 ring-[#4ADE80]" : "ring-line"}`}>
      <Link to={`/match/${leagueKey}/${m.id}`} className="relative block h-[9.5rem] overflow-hidden" style={{ background: awayC }}>
        <span className="absolute inset-0 transition-[clip-path] duration-700" style={{ background: homeC, clipPath: `polygon(0 0, ${mid - half + tilt}% 0, ${mid - half - tilt}% 100%, 0 100%)` }} />
        {draw > 0 && <span className="stage-draw absolute inset-0" style={{ clipPath: `polygon(${mid - half + tilt}% 0, ${mid + half + tilt}% 0, ${mid + half - tilt}% 100%, ${mid - half - tilt}% 100%)` }} />}
        <span className="stage-grain absolute inset-0" />
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 to-transparent" />

        <span className="absolute inset-x-3 top-3 flex items-center justify-between text-[11px] font-semibold">
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-white backdrop-blur-sm">
            <span className="num font-display text-[13px] font-bold">{time(m.kickoff)}</span>{showLeague && m.leagueName ? ` · ${m.leagueName}` : ""}
          </span>
          {valueIdx >= 0 && <span className="stage-glow rounded-full bg-[#4ADE80] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink">Value</span>}
        </span>

        <span className="absolute inset-x-3 bottom-3 flex items-end justify-between">
          <Crest name={m.home} sport={sport} p={p?.[0]} ink={onColor(homeC)} big={fav === 0} />
          {draw > 0 && <span className="mb-1 text-center text-white/85"><span className="block text-[9px] font-bold uppercase tracking-[0.2em]">Draw</span><span className="num font-display text-lg font-bold leading-none">{Math.round(draw * 100)}%</span></span>}
          <Crest name={m.away} sport={sport} p={p?.[p.length - 1]} ink={onColor(awayC)} big={fav === p!.length - 1} right />
        </span>
      </Link>

      <Link to={`/match/${leagueKey}/${m.id}`} className="block px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 font-display text-[1.35rem] font-extrabold leading-[1.05] group-hover:underline underline-offset-2">
            {m.home} <span className="font-sans text-sm font-medium text-ink-faint">v</span> {m.away}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-ink-faint">
          <span className="num truncate">{meta}</span>
          {w && <span dir="rtl" lang="he" className="truncate">{w.he[0]} – {w.he[1]}</span>}
        </div>
      </Link>

      {p && (
        <div className={`mt-auto grid gap-1.5 px-3 pb-3 ${p.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {p.map((x, i) => {
            const on = mine?.selection === sels[i];
            const o = w?.odds?.[i] ?? null;
            const isValue = (w?.edge?.[i] ?? -1) >= VALUE_EDGE;
            return (
              <button key={i} type="button" onClick={() => pick(i)} aria-pressed={on}
                aria-label={`${sels[i] === "1" ? m.home : sels[i] === "2" ? m.away : "Draw"}: ${o ? `Winner pays ${o.toFixed(2)}` : `fair odds ${fair(x)}`}, our chance ${pct(x)}${isValue ? ", value" : ""}`}
                className={`relative flex items-center justify-between gap-1 overflow-hidden rounded-md border px-2.5 py-2 text-left transition-all active:scale-[0.97]
                  ${on ? "border-ink bg-ink text-paper" : isValue ? "border-won bg-won/10 hover:bg-won/20" : i === fav ? "border-marker-deep bg-marker hover:brightness-95" : "border-line bg-paper/60 hover:border-ink"}`}>
                <span className={`font-display text-base font-extrabold ${on ? "text-marker" : ""}`}>{on ? <Check size={16} strokeWidth={3} /> : sels[i]}</span>
                <span className="text-right leading-none">
                  <span className={`num block text-[15px] font-bold ${isValue && !on ? "text-won" : ""}`}>{o ? o.toFixed(2) : fair(x)}</span>
                  <span className={`block text-[9px] font-semibold uppercase tracking-wide ${on ? "text-paper/60" : "text-ink-faint"}`}>{o ? "Winner" : "Fair"}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}

function Crest({ name, sport, p, ink, big, right }: { name: string; sport: string; p?: number; ink: string; big: boolean; right?: boolean }) {
  return (
    <span className={`flex items-end gap-2 ${right ? "flex-row-reverse text-right" : ""}`} style={{ color: ink === "#0D1B14" ? "#FFFFFF" : ink }}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.6)]"><TeamMark name={name} sport={sport} size={32} /></span>
      {p !== undefined && (
        <span className={`num font-display font-extrabold leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${big ? "text-4xl" : "text-2xl opacity-90"}`}>
          {Math.round(p * 100)}<span className="text-[0.5em]">%</span>
        </span>
      )}
    </span>
  );
}

function similar(a: string, b: string) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 90;
}
