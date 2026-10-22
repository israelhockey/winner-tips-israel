import type { Match } from "@/lib/types";
import { isBasketModel, isFootballModel } from "@/lib/types";
import { fair } from "@/lib/format";

// Stadium-board ribbon of fair prices for the coming games. Pauses on hover; still with reduced motion.
export function Ticker({ matches }: { matches: Match[] }) {
  const items = matches.filter((m) => m.model).slice(0, 24);
  if (!items.length) return null;
  const row = (dup: boolean) => items.map((m) => {
    const w = m.winner?.odds;
    const p = w && w.length === 3 ? [["1", 1 / w[0]], ["X", 1 / w[1]], ["2", 1 / w[2]]] as const
      : w && w.length === 2 ? [["1", 1 / w[0]], ["2", 1 / w[1]]] as const
      : isFootballModel(m.model) ? [["1", m.model["1x2"]["1"]], ["X", m.model["1x2"].X], ["2", m.model["1x2"]["2"]]] as const
      : isBasketModel(m.model) ? [["1", m.model.win["1"]], ["2", m.model.win["2"]]] as const : [];
    return (
      <span key={(dup ? "b" : "a") + m.id} className="flex items-center gap-3 pr-10" aria-hidden={dup}>
        <span className="font-display text-base font-bold uppercase tracking-wide text-white">{m.home} <span className="text-white/45">v</span> {m.away}</span>
        {w && <span className="rounded-sm bg-white/10 px-1 text-[10px] font-bold text-white/70">WINNER</span>}
        {p.map(([k, v]) => (
          <span key={k} className="num text-sm"><span className="text-marker">{k}</span> <span className="text-white/85">{fair(v)}</span></span>
        ))}
      </span>
    );
  });
  return (
    <div className="ticker bleed overflow-hidden border-y border-white/10 bg-ink py-3" aria-label="Fair odds for upcoming games">
      <div className="ticker-track flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}
