import { Link } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { TriBar } from "./TriBar";
import { TeamMark } from "./bits";
import { time, fair } from "@/lib/format";
import { isBasketModel, isFootballModel, type Match } from "@/lib/types";
import { useApp } from "@/lib/state";

// One fixture: kickoff, teams, the model's split, and one-tap add to ticket.
export function FixtureRow({ m, leagueKey, showLeague = false, compact = false }: { m: Match; leagueKey: string; showLeague?: boolean; compact?: boolean }) {
  const { addLeg, hasLeg, removeLeg } = useApp();
  const fm = isFootballModel(m.model) ? m.model : null;
  const bm = isBasketModel(m.model) ? m.model : null;
  const probs = fm ? [fm["1x2"]["1"], fm["1x2"].X, fm["1x2"]["2"]] : bm ? [bm.win["1"], bm.win["2"]] : null;
  const sels = fm ? ["1", "X", "2"] : ["1", "2"];
  const event = `${m.home} v ${m.away}`;

  return (
    <div className={`grid grid-cols-[3.25rem_1fr] gap-x-3 gap-y-3 border-b border-ink-line px-4 py-4 last:border-b-0 ${compact ? "" : "md:grid-cols-[3.5rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center"}`}>
      <div className="num text-sm font-semibold">{time(m.kickoff)}</div>
      <Link to={`/match/${leagueKey}/${m.id}`} className="group min-w-0">
        {showLeague && m.leagueName && <div className="mb-1 text-xs text-chalk-faint">{m.leagueName}</div>}
        <div className="flex items-center gap-2 truncate font-semibold group-hover:text-amber">
          <TeamMark name={m.home} size={22} /> <span className="truncate">{m.home}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 truncate font-semibold group-hover:text-amber">
          <TeamMark name={m.away} size={22} /> <span className="truncate">{m.away}</span>
        </div>
      </Link>
      <div className={`col-span-2 ${compact ? "" : "md:col-span-1"}`}>
        {probs ? <TriBar p={probs} /> : <span className="text-sm muted">No model yet for this match</span>}
        {fm && (
          <div className="mt-2 text-xs text-chalk-faint num">
            Expected goals {fm.xg[0].toFixed(2)} – {fm.xg[1].toFixed(2)}
          </div>
        )}
        {bm && (
          <div className="mt-2 text-xs text-chalk-faint num">
            Projected margin {bm.spread > 0 ? `${m.home.split(" ").at(-1)} by ${bm.spread.toFixed(1)}` : `${m.away.split(" ").at(-1)} by ${(-bm.spread).toFixed(1)}`}
            {bm.total ? `, total ${bm.total.toFixed(0)}` : ""}
          </div>
        )}
      </div>
      {probs && !compact && (
        <div className="col-span-2 flex gap-1.5 md:col-span-1">
          {sels.map((s, i) => {
            const key = `${m.id}|${fm ? "1X2" : "Moneyline"}|${s}`;
            const on = hasLeg(key);
            return (
              <button
                key={s}
                onClick={() => on ? removeLeg(key) : addLeg({
                  key, matchId: m.id, league: leagueKey, event, kickoff: m.kickoff,
                  market: fm ? "1X2" : "Moneyline", selection: s,
                  label: s === "1" ? m.home : s === "2" ? m.away : "Draw",
                  modelP: probs[i], odds: null,
                })}
                className={`flex h-10 min-w-[3.25rem] flex-col items-center justify-center rounded-lg border text-xs transition-colors ${on ? "border-amber bg-amber-soft text-amber" : "border-ink-line hover:border-chalk-faint"}`}
                aria-pressed={on}
                aria-label={`${on ? "Remove" : "Add"} ${s === "1" ? m.home : s === "2" ? m.away : "draw"} to ticket`}
              >
                <span className="flex items-center gap-0.5 font-bold">{on ? <Check size={12} /> : <Plus size={12} />}{s}</span>
                <span className="num text-[10px] text-chalk-faint">{fair(probs[i])}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
