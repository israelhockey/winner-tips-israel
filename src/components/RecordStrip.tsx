import { Link } from "react-router-dom";
import { useIndex } from "@/lib/data";
import { pct, units } from "@/lib/format";

// The record, scoreboard-style, above every page. Losses show as plainly as wins.
export function RecordStrip() {
  const { data } = useIndex();
  const r = data?.record;
  return (
    <Link to="/record" className="block bg-ink text-white/75 hover:text-white">
      <div className="mx-auto flex h-9 max-w-page items-center gap-5 overflow-x-auto whitespace-nowrap px-4 text-xs md:px-6">
        <span className="font-display text-sm font-extrabold text-marker">Public record</span>
        {!r || r.graded === 0 ? (
          <span>
            {r && r.pending > 0
              ? `${r.pending} pick${r.pending === 1 ? "" : "s"} locked, waiting for kickoff. Every pick stays on the record, won or lost.`
              : "Opens with the first official pick. Every pick is locked before kickoff and stays on the record, won or lost."}
          </span>
        ) : (
          <>
            <span className={`num font-bold ${r.units >= 0 ? "text-[#5BD49A]" : "text-[#FF8A73]"}`}>{units(r.units)}</span>
            <span className="num">ROI {pct(r.roi, 1)}</span>
            <span className="num">{r.won}/{r.graded} won</span>
            <span className="num">avg odds {r.avgOdds.toFixed(2)}</span>
            <span className="flex items-center gap-1" aria-label={`Last ten: ${r.last10.join(" ")}`}>
              {r.last10.map((x, i) => <span key={i} className={`h-2 w-2 rounded-full ${x === "W" ? "bg-[#5BD49A]" : "bg-[#FF8A73]"}`} />)}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
