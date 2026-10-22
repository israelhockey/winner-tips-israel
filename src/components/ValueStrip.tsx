import { Link } from "react-router-dom";
import type { Match } from "@/lib/types";
import { VALUE_EDGE } from "@/lib/config";
import { dayLabel, time, pct, signedPct, ago } from "@/lib/format";

// The best-priced bets on Winner right now, one per game.
export function ValueStrip({ matches, fetchedAt }: { matches: Match[]; fetchedAt: string }) {
  const best = matches
    .filter((m) => m.winner?.best && Date.parse(m.kickoff) > Date.now())
    .map((m) => ({ m, b: m.winner!.best }))
    .sort((a, b) => b.b.edge - a.b.edge);
  const value = best.filter((x) => x.b.edge >= VALUE_EDGE);
  const list = (value.length ? value : best).slice(0, 6);
  if (!list.length) return null;
  return (
    <div>
      <p className="-mt-1 mb-5 max-w-2xl muted">
        {value.length
          ? `Where Winner pays more than our fair price right now. ${value.length} bet${value.length === 1 ? " clears" : "s clear"} the ${pct(VALUE_EDGE)} bar.`
          : "Nothing clears our value bar right now (Winner's margin makes value rare). These are the closest."}{" "}
        <span className="text-ink-faint">Winner odds updated {ago(fetchedAt)}.</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ m, b }) => {
          const good = b.edge >= VALUE_EDGE;
          return (
            <Link key={m.id} to={`/match/${m.league}/${m.id}`}
              className={`group panel flex flex-col gap-3 p-4 transition-colors hover:border-ink ${good ? "border-won/40" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-ink-faint">{m.leagueName}, {dayLabel(m.kickoff)} {time(m.kickoff)}</div>
                  <div className="truncate font-semibold group-hover:underline underline-offset-2">{m.home} v {m.away}</div>
                </div>
                <span className={`num shrink-0 rounded-sm px-1.5 py-0.5 text-xs font-bold ${good ? "bg-won text-white" : "bg-well text-ink-muted"}`}>{signedPct(b.edge)}</span>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-dashed border-line pt-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{b.label}{b.market === "1X2" || b.market === "Winner" ? (b.sel === "X" ? "" : " to win") : ""}</div>
                  <div className="text-xs text-ink-muted">Our chance {pct(b.p)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Winner pays</div>
                  <div className="num font-display text-2xl font-extrabold leading-none">{b.odds.toFixed(2)}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
