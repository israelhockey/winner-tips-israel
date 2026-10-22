import type React from "react";
import { Link } from "react-router-dom";
import type { Match } from "@/lib/types";
import { isBasketModel, isFootballModel } from "@/lib/types";
import { dayLabel, fair, time } from "@/lib/format";

// A printed Winner-style coupon for the hero: the next games, each with its three boxes,
// the model's favourite marked in highlighter. Read-only; the real coupon rows are below.
export function Coupon({ title, matches }: { title: string; matches: Match[] }) {
  return (
    <div className="coupon print-in w-full max-w-[460px] rotate-[-1.5deg] rounded-[3px] px-3.5 pb-5 pt-4 sm:px-5 text-ink">
      <div className="flex items-end justify-between border-b-2 border-ink pb-2">
        <div>
          <div className="font-display text-2xl font-extrabold leading-none">{title}</div>
          <div className="mt-1 text-[11px] text-ink-muted">Model prices, fair odds with no margin</div>
        </div>
        <div className="flex gap-1 sm:gap-1.5 pb-0.5 font-display text-sm font-extrabold">
          {["1", "X", "2"].map((x) => <span key={x} className="w-10 text-center sm:w-12">{x}</span>)}
        </div>
      </div>
      <ol>
        {matches.map((m, row) => {
          const p = isFootballModel(m.model) ? [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]]
            : isBasketModel(m.model) ? [m.model.win["1"], null, m.model.win["2"]] : null;
          if (!p) return null;
          const real = p.filter((x): x is number => x !== null);
          const fav = Math.max(...real);
          return (
            <li key={m.id}>
              <Link to={`/match/${m.league}/${m.id}`} className="flex items-center gap-3 border-b border-dashed border-line py-2.5 hover:bg-paper/60">
                <span className="num w-5 font-display text-sm font-bold text-ink-faint">{row + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold leading-tight">{m.home}</span>
                  <span className="block truncate text-[13px] font-semibold leading-tight">{m.away}</span>
                  <span className="num text-[10px] text-ink-faint">{dayLabel(m.kickoff)} {time(m.kickoff)}</span>
                </span>
                <span className="flex gap-1 sm:gap-1.5">
                  {p.map((x, i) => (
                    <span key={i} className={`relative grid h-9 w-10 place-items-center sm:w-12 rounded-[3px] border text-[13px] font-semibold num
                      ${x === null ? "border-line bg-paper text-ink-faint" : x === fav ? "border-ink bg-card" : "border-line"}`}>
                      {x === fav && <span className="mark-in absolute inset-[3px] rounded-[2px] bg-marker" style={{ animationDelay: `${0.5 + row * 0.12}s` }} />}
                      <span className="relative">{x === null ? "" : fair(x)}</span>
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-ink-faint">Marked: our most likely result</span>
        <svg width="92" height="18" viewBox="0 0 92 18" aria-hidden>
          {[2,1,3,1,2,1,1,3,2,1,2,3,1,1,2,1,3,1,2,2,1,3,1,2].reduce<{ x: number; els: React.ReactElement[] }>((acc, w, i) => {
            if (i % 2 === 0) acc.els.push(<rect key={i} x={acc.x} y="0" width={w} height="18" fill="#0D1B14" />);
            acc.x += w + 1.6; return acc;
          }, { x: 0, els: [] }).els}
        </svg>
      </div>
    </div>
  );
}
