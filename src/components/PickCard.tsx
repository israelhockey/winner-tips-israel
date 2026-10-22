import { Link } from "react-router-dom";
import { Lock, Plus, Check } from "lucide-react";
import type { Pick } from "@/lib/types";
import { dayLabel, time, units } from "@/lib/format";
import { useApp } from "@/lib/state";

const RESULT_TONE: Record<string, string> = { won: "text-won", lost: "text-lost", void: "text-draw", pending: "text-ink-muted" };

export function selectionText(p: Pick) {
  const [home, away] = p.event.split(" v ");
  if (p.market === "1X2" || p.market === "Moneyline") return p.selection === "1" ? `${home} to win` : p.selection === "2" ? `${away} to win` : "Draw";
  if (p.market === "Handicap") return `${p.selection === "1" ? home : p.selection === "2" ? away : "Draw"} (${p.line && p.line > 0 ? "+" : ""}${p.line} handicap)`;
  if (p.market === "Over/Under") return `${p.selection} ${p.line} goals`;
  if (p.market === "BTTS") return `Both teams to score: ${p.selection}`;
  if (p.market === "Double chance") return `Double chance ${p.selection}`;
  return `${p.market}: ${p.selection}`;
}

export function PickCard({ pick, locked }: { pick: Pick; locked: boolean }) {
  const { addLeg, hasLeg } = useApp();
  const key = `${pick.matchId ?? pick.id}|${pick.market}${pick.line ?? ""}|${pick.selection}`;
  const confidence = "●".repeat(pick.confidence) + "○".repeat(3 - pick.confidence);
  return (
    <article className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3 text-xs">
        <span className="muted">{pick.leagueName}</span>
        <span className="num muted">{dayLabel(pick.kickoff)} {time(pick.kickoff)}</span>
      </div>
      <h3 className="mt-2 text-lg font-bold">{pick.event}</h3>

      {locked ? (
        <div className="mt-4 flex flex-1 flex-col justify-between gap-4 rounded-xl border border-dashed border-line p-4">
          <p className="flex items-center gap-2 text-sm muted"><Lock size={14} /> Pro pick, locked {dayLabel(pick.lockedAt)} at {time(pick.lockedAt)}</p>
          <Link to="/membership" className="btn-primary self-start">See Pro picks</Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs muted">{pick.market}</div>
              <div className="font-semibold text-accent">{selectionText(pick)}</div>
            </div>
            <div className="text-right">
              <div className="display num text-2xl font-bold">{pick.odds.toFixed(2)}</div>
              <div className="num text-xs muted">{pick.units}u stake</div>
            </div>
          </div>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/85">{pick.analysis}</p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-xs">
            <span className="muted">
              <span className="tracking-widest text-accent" aria-label={`Confidence ${pick.confidence} of 3`}>{confidence}</span> {pick.tipster}
            </span>
            {pick.result === "pending" ? (
              <button
                className={`chip ${hasLeg(key) ? "chip-on" : ""}`}
                onClick={() => addLeg({
                  key, matchId: pick.matchId ?? pick.id, league: pick.league, event: pick.event, kickoff: pick.kickoff,
                  market: pick.market, selection: pick.selection, label: selectionText(pick), modelP: null, odds: pick.odds,
                })}
              >
                {hasLeg(key) ? <Check size={12} /> : <Plus size={12} />} Ticket
              </button>
            ) : (
              <span className={`num font-bold ${RESULT_TONE[pick.result]}`}>
                {pick.result === "won" ? "Won" : pick.result === "lost" ? "Lost" : "Void"} {pick.final ? `(${pick.final})` : ""} {units(pick.profit)}
              </span>
            )}
          </div>
        </>
      )}
    </article>
  );
}
