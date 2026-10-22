import { Link } from "react-router-dom";
import { useIndex } from "@/lib/data";
import { pct, units } from "@/lib/format";

// The record, on every page. Losses show as plainly as wins.
export function RecordStrip() {
  const { data } = useIndex();
  const r = data?.record;
  return (
    <Link to="/record" className="block border-t border-ink-line bg-ink-sunk hover:bg-ink-raised">
      <div className="rise mx-auto flex h-10 max-w-page items-center gap-5 overflow-x-auto whitespace-nowrap px-4 text-xs md:px-6">
        {!r || r.graded === 0 ? (
          <>
            <span className="font-semibold text-chalk">Public record</span>
            <span className="muted">
              {r && r.pending > 0
                ? `${r.pending} pick${r.pending === 1 ? "" : "s"} locked and waiting for kickoff. Every pick stays on the record, won or lost.`
                : "Opens with the first official pick. Every pick is locked before kickoff and stays on the record, won or lost."}
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-chalk">Record</span>
            <span className={`num font-bold ${r.units >= 0 ? "text-won" : "text-lost"}`}>{units(r.units)}</span>
            <span className="muted num">ROI {pct(r.roi, 1)}</span>
            <span className="muted num">{r.won}/{r.graded} won</span>
            <span className="muted num">avg odds {r.avgOdds.toFixed(2)}</span>
            <span className="flex items-center gap-1" aria-label={`Last ten: ${r.last10.join(" ")}`}>
              {r.last10.map((x, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${x === "W" ? "bg-won" : "bg-lost"}`} />)}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
