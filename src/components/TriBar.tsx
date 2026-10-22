import { fair, pct } from "@/lib/format";

// The site's signature: one bar split into the three outcomes, each segment as wide as its
// probability, with the fair odds underneath. Two segments for basketball (no draw).
export function TriBar({ p, labels, compact = false, highlight }: {
  p: number[];
  labels?: string[];
  compact?: boolean;
  highlight?: number; // index of the outcome to accent, e.g. a pick's selection
}) {
  const names = labels ?? (p.length === 3 ? ["1", "X", "2"] : ["1", "2"]);
  const fav = p.indexOf(Math.max(...p));
  const tone = (i: number) =>
    i === highlight ? "bg-amber" : i === fav ? "bg-chalk" : names[i] === "X" ? "bg-draw/60" : "bg-chalk-faint";
  return (
    <div className="w-full" aria-label={names.map((n, i) => `${n} ${pct(p[i])}`).join(", ")} role="img">
      <div className={`flex w-full gap-[3px] ${compact ? "h-2" : "h-3"}`}>
        {p.map((x, i) => (
          <div key={i} className={`${tone(i)} first:rounded-l-full last:rounded-r-full`} style={{ width: `${Math.max(x * 100, 2)}%` }} />
        ))}
      </div>
      {!compact && (
        <div className="mt-1.5 flex w-full justify-between gap-2 text-xs num">
          {p.map((x, i) => (
            <span key={i} className={`whitespace-nowrap ${i === p.length - 1 ? "text-right" : i === 1 && p.length === 3 ? "text-center" : ""}`}>
              <span className={i === highlight ? "text-amber font-semibold" : i === fav ? "text-chalk font-semibold" : "text-chalk-muted"}>
                {names[i]} {pct(x)}
              </span>
              <span className="ml-1.5 text-chalk-faint" title="Fair odds">{fair(x)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
