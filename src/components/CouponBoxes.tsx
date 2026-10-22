import { fair, pct } from "@/lib/format";

// The 1 / X / 2 boxes from a Winner coupon. Each shows our chance and the fair price; the
// model's favourite is marked in highlighter, and the reader's own selection gets a pen tick.
export function CouponBoxes({ p, labels, selected, onPick, size = "md" }: {
  p: number[];
  labels?: string[];
  selected?: number | null;
  onPick?: (i: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const names = labels ?? (p.length === 3 ? ["1", "X", "2"] : ["1", "2"]);
  const fav = p.indexOf(Math.max(...p));
  const h = size === "lg" ? "h-[5.25rem]" : size === "sm" ? "h-14" : "h-16";
  const big = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <div className={`grid gap-1.5 ${p.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {p.map((x, i) => {
        const on = selected === i;
        const Tag = onPick ? "button" : "div";
        return (
          <Tag
            key={i}
            {...(onPick ? { onClick: () => onPick(i), "aria-pressed": on, type: "button" as const } : {})}
            aria-label={`${names[i]}: ${pct(x)}, fair odds ${fair(x)}${on ? ", on your ticket" : ""}`}
            className={`relative flex ${h} flex-col justify-between rounded border px-2.5 py-1.5 text-left transition-colors
              ${on ? "border-ink bg-ink text-paper" : i === fav ? "border-marker-deep bg-marker" : "border-line bg-card"}
              ${onPick && !on ? "hover:border-ink" : ""}`}
          >
            <span className="flex items-baseline justify-between">
              <span className={`font-display text-sm font-extrabold ${on ? "text-paper" : "text-ink"}`}>{names[i]}</span>
              <span className={`num text-[11px] ${on ? "text-paper/70" : "text-ink-muted"}`}>{fair(x)}</span>
            </span>
            <span className={`num font-display ${big} font-bold leading-none`}>{Math.round(x * 100)}<span className="text-[0.55em]">%</span></span>
            {on && (
              <svg className="mark-in absolute right-1.5 top-1/2 h-5 w-5 -translate-y-1/3" viewBox="0 0 20 20" aria-hidden>
                <path d="M3 11 L8 15 L17 4" fill="none" stroke="#FFE14D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
