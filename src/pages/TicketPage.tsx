import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useApp } from "@/lib/state";
import { dayLabel, time, fair, pct, signedPct } from "@/lib/format";
import { Empty } from "@/components/bits";

// Builds a Winner ticket from the legs the reader picked: combined odds, payout, and how
// likely the whole ticket is by our model. Print it or take it to a kiosk.
export default function TicketPage() {
  const { legs, removeLeg, setOdds, clearLegs } = useApp();
  const [stake, setStake] = useState("20");

  if (legs.length === 0) {
    return (
      <>
        <h1 className="h1">Your ticket</h1>
        <div className="mt-8"><Empty title="Your ticket is empty">Add results from <Link className="underline" to="/fixtures">fixtures</Link> or <Link className="underline" to="/picks">picks</Link>, then type in Winner's odds to see your payout.</Empty></div>
      </>
    );
  }

  const sorted = [...legs].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const priced = sorted.every((l) => l.odds && l.odds > 1);
  const combined = sorted.reduce((s, l) => s * (l.odds ?? 1), 1);
  const modelled = sorted.every((l) => l.modelP);
  const pAll = sorted.reduce((s, l) => s * (l.modelP ?? 1), 1);
  const s = Number(stake) || 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h1">Your ticket</h1>
        <div className="flex gap-2 print:hidden">
          <button className="btn-quiet" onClick={() => window.print()}>Print ticket</button>
          <button className="btn-quiet" onClick={clearLegs}>Clear</button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <ol className="panel divide-y divide-ink-line">
          {sorted.map((l, i) => (
            <li key={l.key} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 px-4 py-4">
              <span className="num text-sm text-chalk-faint">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-xs text-chalk-faint">{dayLabel(l.kickoff)} {time(l.kickoff)}</div>
                <div className="truncate font-semibold">{l.event}</div>
                <div className="text-sm text-amber">{l.market}: {l.label}</div>
                {l.modelP && <div className="num text-xs muted">Our chance {pct(l.modelP)}, fair {fair(l.modelP)}</div>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  aria-label={`Winner odds for ${l.label}`}
                  placeholder="Odds"
                  defaultValue={l.odds ?? ""}
                  onChange={(e) => { const v = Number(e.target.value.replace(",", ".")); setOdds(l.key, v > 1 ? v : null); }}
                  className="num w-20 rounded-lg border border-ink-line bg-ink-sunk px-2 py-1.5 text-sm outline-none focus:border-amber"
                />
                <button className="rounded-lg p-2 text-chalk-faint hover:text-lost print:hidden" onClick={() => removeLeg(l.key)} aria-label={`Remove ${l.label}`}><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ol>

        <aside className="panel p-5 lg:sticky lg:top-32">
          <label className="block text-sm">
            <span className="muted">Stake (₪)</span>
            <input inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} className="num mt-1 w-full rounded-lg border border-ink-line bg-ink-sunk px-3 py-2 text-lg outline-none focus:border-amber" />
          </label>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="muted">Selections</dt><dd className="num font-semibold">{sorted.length}</dd></div>
            <div className="flex justify-between"><dt className="muted">Combined odds</dt><dd className="num font-semibold">{priced ? combined.toFixed(2) : "Add every leg's odds"}</dd></div>
            <div className="flex justify-between"><dt className="muted">Potential return</dt><dd className="wide num text-xl font-bold">{priced ? `₪${(combined * s).toFixed(2)}` : "–"}</dd></div>
            {modelled && <div className="flex justify-between"><dt className="muted">Chance all legs win</dt><dd className="num font-semibold">{pct(pAll, 1)}</dd></div>}
            {modelled && priced && (
              <div className="flex justify-between"><dt className="muted">Value of the ticket</dt>
                <dd className={`num font-semibold ${pAll * combined - 1 >= 0 ? "text-amber" : "text-lost"}`}>{signedPct(pAll * combined - 1)}</dd></div>
            )}
          </dl>
          <p className="mt-5 border-t border-ink-line pt-4 text-xs text-chalk-faint">
            Winner sets its own rules on how many games a ticket needs and which games can be combined; check the coupon before you play.
            Each extra leg multiplies the odds and the margin against you.
          </p>
        </aside>
      </div>
    </>
  );
}
