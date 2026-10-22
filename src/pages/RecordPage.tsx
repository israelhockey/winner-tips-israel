import { useMemo, useState } from "react";
import { useRecord } from "@/lib/data";
import { pct, units, shortDate } from "@/lib/format";
import { ProfitChart } from "@/components/ProfitChart";
import { selectionText } from "@/components/PickCard";
import { Loading, Stat, Section } from "@/components/bits";
import type { PicksRecord } from "@/lib/types";

// The full, unedited ledger. Free and Pro picks together, so nothing can be cherry-picked.
export default function RecordPage() {
  const { data } = useRecord();
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => (data?.picks ?? []).filter((p) => filter === "all" || p.leagueName === filter || p.market === filter), [data, filter]);
  if (!data) return <Loading what="the record" />;
  const s = data.summary;

  return (
    <>
      <h1 className="h1">The record</h1>
      <p className="mt-3 max-w-2xl muted">
        Every pick we have ever published, at the Winner odds we quoted, graded in units (one unit is one standard stake).
        Picks can't be edited or deleted once they're locked. Losing months stay here too.
      </p>

      {s.picks === 0 ? (
        <div className="mt-8 panel px-6 py-10">
          <p className="h3">The record starts with the first pick</p>
          <p className="mt-2 max-w-xl text-sm muted">
            From then on this page shows running profit, return on stake, win rate and average odds, split by league and market,
            plus how often our price beat Winner's closing price.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-6 panel p-6 md:grid-cols-5">
            <Stat label="Profit" value={units(s.units)} tone={s.units >= 0 ? "good" : "bad"} />
            <Stat label="Return on stake" value={pct(s.roi, 1)} />
            <Stat label="Won" value={`${s.won}/${s.graded}`} />
            <Stat label="Average odds" value={s.avgOdds.toFixed(2)} />
            <Stat label="Beat the closing price" value={s.beatClosing === null ? "–" : pct(s.beatClosing)} />
          </div>
          {data.curve.length > 1 && <div className="mt-6 panel p-4"><ProfitChart points={data.curve} /></div>}

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Split title="By league" rows={data.byLeague} />
            <Split title="By market" rows={data.byMarket} />
          </div>

          <Section title="Every pick">
            <div className="mb-4 flex flex-wrap gap-2">
              {["all", ...new Set(data.picks.map((p) => p.leagueName))].map((k) => (
                <button key={k} className={`chip ${filter === k ? "chip-on" : ""}`} onClick={() => setFilter(k)}>{k === "all" ? "All" : k}</button>
              ))}
            </div>
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs muted">
                  <tr className="border-b border-ink-line">
                    <th className="px-4 py-3 font-semibold">Locked</th><th className="px-4 py-3 font-semibold">Game</th><th className="px-4 py-3 font-semibold">Pick</th>
                    <th className="px-4 py-3 text-right font-semibold">Odds</th><th className="px-4 py-3 text-right font-semibold">Stake</th>
                    <th className="px-4 py-3 text-right font-semibold">Result</th><th className="px-4 py-3 text-right font-semibold">Profit</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-ink-line last:border-0">
                      <td className="px-4 py-3 muted">{shortDate(p.lockedAt)}</td>
                      <td className="px-4 py-3"><div className="font-semibold">{p.event}</div><div className="text-xs text-chalk-faint">{p.leagueName}</div></td>
                      <td className="px-4 py-3">{selectionText(p)}</td>
                      <td className="px-4 py-3 text-right">{p.odds.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{p.units}u</td>
                      <td className={`px-4 py-3 text-right font-semibold ${p.result === "won" ? "text-won" : p.result === "lost" ? "text-lost" : "muted"}`}>
                        {p.result === "pending" ? "Pending" : `${p.result[0].toUpperCase()}${p.result.slice(1)}${p.final ? ` ${p.final}` : ""}`}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${p.profit > 0 ? "text-won" : p.profit < 0 ? "text-lost" : "muted"}`}>{p.result === "pending" ? "–" : units(p.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function Split({ title, rows }: { title: string; rows: PicksRecord["byLeague"] }) {
  return (
    <div className="panel">
      <h2 className="border-b border-ink-line px-5 py-4 font-semibold">{title}</h2>
      <table className="w-full text-sm num">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-ink-line last:border-0">
              <td className="px-5 py-3 font-semibold">{r.key}</td>
              <td className="px-3 py-3 text-right muted">{r.won}/{r.picks}</td>
              <td className="px-3 py-3 text-right muted">{pct(r.roi, 1)}</td>
              <td className={`px-5 py-3 text-right font-semibold ${r.profit >= 0 ? "text-won" : "text-lost"}`}>{units(r.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
