import { useMemo, useState } from "react";
import { useRecord } from "@/lib/data";
import { pct, units, shortDate } from "@/lib/format";
import { ProfitChart } from "@/components/ProfitChart";
import { selectionText } from "@/components/PickCard";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Loading, Stat, Section } from "@/components/bits";
import { PageHero } from "@/components/PageHero";
import { Scorecards } from "@/components/Scorecards";
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
      <PageHero eyebrow="The record" title="Every pick. Won or lost."
        intro="Every pick we've published, at the Winner odds when it was locked, graded automatically from the final score. Nothing is edited or deleted, and the model's picks are sealed so you can check that yourself."
        color="#0D1B14" deep="#0E5A3A"
        stats={s.picks ? [
          [units(s.units), "profit, 1 unit stakes"],
          [pct(s.roi, 1), "return on stake"],
          [`${s.won}/${s.graded}`, "won"],
          [s.beatClosing === null ? "–" : pct(s.beatClosing), "beat Winner's closing price"],
        ] : [[0, "picks so far"]]}>
        <Link to="/verify" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
          <ShieldCheck size={16} className="text-[#4ADE80]" /> Verify the sealed picks
        </Link>
      </PageHero>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Explain title="Units">One unit is one standard stake. +5u means five stakes' worth of profit, whatever size your stake is.</Explain>
        <Explain title="The closing price">Winner's odds just before kickoff, after all the team news is in. If we took 2.20 and it closed at 2.00, we beat the close: the market moved our way.</Explain>
        <Explain title="Why it matters">Wins and losses swing on luck for months. Beating the closing price, again and again, is the clearest sign a tipster has real skill.</Explain>
      </div>

      <Scorecards sealed={s} />

      <h2 id="every-pick" className="h2 mt-14 scroll-mt-24">Sealed value picks</h2>
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
            <Stat label="Average odds" value={s.avgOdds ? s.avgOdds.toFixed(2) : "–"} />
            <Stat label="Beat the close" value={s.beatClosing === null ? "–" : pct(s.beatClosing)} />
            <Stat label="Average price vs close" value={s.avgClv === null ? "–" : `${s.avgClv > 0 ? "+" : ""}${(s.avgClv * 100).toFixed(1)}%`} tone={s.avgClv === null ? undefined : s.avgClv >= 0 ? "good" : "bad"} />
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
                  <tr className="border-b border-line">
                    <th className="px-4 py-3 font-semibold">Locked</th><th className="px-4 py-3 font-semibold">Game</th><th className="px-4 py-3 font-semibold">Pick</th>
                    <th className="px-4 py-3 text-right font-semibold">Odds</th><th className="px-4 py-3 text-right font-semibold">Closed</th><th className="px-4 py-3 text-right font-semibold">Stake</th>
                    <th className="px-4 py-3 text-right font-semibold">Result</th><th className="px-4 py-3 text-right font-semibold">Profit</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 muted">{shortDate(p.lockedAt)}</td>
                      <td className="px-4 py-3"><div className="font-semibold">{p.event}</div><div className="text-xs text-ink-faint">{p.leagueName}</div></td>
                      <td className="px-4 py-3">
                        <div>{selectionText(p)}</div>
                        <div className="flex items-center gap-2 text-xs text-ink-faint">
                          {p.tipster}
                          {p.hash && <Link to={`/verify#${p.id}`} className="inline-flex items-center gap-0.5 font-semibold text-won hover:underline"><ShieldCheck size={12} /> sealed</Link>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{p.odds.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        {p.closingOdds && p.closingOdds !== p.odds
                          ? <span className={p.odds > p.closingOdds ? "font-semibold text-won" : "text-ink-muted"}>{p.closingOdds.toFixed(2)}</span>
                          : <span className="text-ink-faint">{p.closingOdds ? p.closingOdds.toFixed(2) : "–"}</span>}
                      </td>
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
      <h2 className="border-b border-line px-5 py-4 font-semibold">{title}</h2>
      <table className="w-full text-sm num">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-0">
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

function Explain({ title, children }: { title: string; children: string }) {
  return (
    <div className="panel p-5">
      <h3 className="font-display text-xl font-extrabold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
