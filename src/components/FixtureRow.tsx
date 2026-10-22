import { Link } from "react-router-dom";
import { CouponBoxes } from "./CouponBoxes";
import { TeamMark } from "./bits";
import { time } from "@/lib/format";
import { isBasketModel, isFootballModel, type Match } from "@/lib/types";
import { useApp } from "@/lib/state";

// One line of the coupon: kickoff, the two clubs, and the 1 / X / 2 boxes.
// Tapping a box puts that result on your ticket.
export function FixtureRow({ m, leagueKey, showLeague = false, compact = false }: { m: Match; leagueKey: string; showLeague?: boolean; compact?: boolean }) {
  const { addLeg, legs, removeLeg } = useApp();
  const fm = isFootballModel(m.model) ? m.model : null;
  const bm = isBasketModel(m.model) ? m.model : null;
  const w = m.winner;
  const probs = w?.p ?? (fm ? [fm["1x2"]["1"], fm["1x2"].X, fm["1x2"]["2"]] : bm ? [bm.win["1"], bm.win["2"]] : null);
  const sels = fm ? ["1", "X", "2"] : ["1", "2"];
  const market = fm ? "1X2" : "Moneyline";
  const event = `${m.home} v ${m.away}`;
  const mine = legs.find((l) => l.matchId === m.id && l.market === market);
  const selected = mine ? sels.indexOf(mine.selection) : null;

  const pick = (i: number) => {
    if (!probs) return;
    const s = sels[i];
    const key = `${m.id}|${market}|${s}`;
    if (mine?.key === key) return removeLeg(key);
    addLeg({ key, matchId: m.id, league: leagueKey, event, kickoff: m.kickoff, market, selection: s,
      label: s === "1" ? m.home : s === "2" ? m.away : "Draw", modelP: probs[i], odds: w?.odds?.[i] ?? null });
  };

  const meta = fm
    ? `Expected goals ${fm.xg[0].toFixed(1)}–${fm.xg[1].toFixed(1)}`
    : bm ? `${bm.spread > 0 ? m.home.split(" ").at(-1) : m.away.split(" ").at(-1)} by ${Math.abs(bm.spread).toFixed(1)} pts${bm.total ? ` · ${bm.total.toFixed(0)} total points` : ""}` : "";

  return (
    <div className={`grid gap-x-4 gap-y-3 border-b border-line px-4 py-3.5 last:border-b-0 ${compact ? "grid-cols-[3rem_1fr]" : "grid-cols-[3rem_1fr] md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(15rem,20rem)] md:items-center"}`}>
      <div className="pt-0.5">
        <div className="num font-display text-lg font-bold leading-none">{time(m.kickoff)}</div>
      </div>
      <Link to={`/match/${leagueKey}/${m.id}`} className="group min-w-0">
        {showLeague && m.leagueName && <div className="mb-1 text-[11px] font-medium text-ink-faint">{m.leagueName}</div>}
        <div className="flex items-center gap-2 font-semibold group-hover:underline underline-offset-2">
          <TeamMark name={m.home} size={20} /> <span className="truncate">{m.home}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 font-semibold group-hover:underline underline-offset-2">
          <TeamMark name={m.away} size={20} /> <span className="truncate">{m.away}</span>
        </div>
        {meta && <div className="num mt-1.5 text-[11px] text-ink-faint">{meta}</div>}
        {w && <div dir="rtl" lang="he" className="mt-0.5 text-left text-[11px] text-ink-faint">{w.he[0]} – {w.he[1]}</div>}
      </Link>
      <div className={compact ? "col-span-2" : "col-span-2 md:col-span-1"}>
        {probs ? <CouponBoxes p={probs} selected={selected} onPick={pick} size="sm" odds={w?.odds} edges={w?.edge} /> : <span className="text-sm muted">No model yet</span>}
      </div>
    </div>
  );
}
