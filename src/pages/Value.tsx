import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { useIndex } from "@/lib/data";
import { dayLabel, time, fair, pct, signedPct, ago } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import { useApp } from "@/lib/state";
import { Loading } from "@/components/bits";
import type { Match } from "@/lib/types";

// Every bet Winner offers on the games we cover, checked against our numbers and sorted by value.
interface Row { m: Match; market: string; line: number | null; sel: string; label: string; odds: number; p: number; edge: number }

export default function Value() {
  const { data: index } = useIndex();
  const { addLeg, hasLeg, removeLeg } = useApp();
  const [league, setLeague] = useState("all");
  const [onlyValue, setOnlyValue] = useState(true);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const m of index?.upcoming ?? []) {
      if (!m.winner || Date.parse(m.kickoff) < Date.now()) continue;
      for (const x of m.winner.markets) x.sels.forEach((sel, i) => out.push({ m, market: x.market, line: x.line, sel, label: x.labels[i], odds: x.odds[i], p: x.p[i], edge: x.edge[i] }));
    }
    return out.sort((a, b) => b.edge - a.edge);
  }, [index]);

  const leagues = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) seen.set(r.m.league!, r.m.leagueName!);
    return [...seen];
  }, [rows]);
  const inLeague = rows.filter((r) => league === "all" || r.m.league === league);
  const value = inLeague.filter((r) => r.edge >= VALUE_EDGE);
  const shown = onlyValue ? (value.length ? value : inLeague.slice(0, 10)) : inLeague.slice(0, 150);

  return (
    <>
      <h1 className="h1">Value finder</h1>
      <p className="mt-3 max-w-2xl muted">
        Every bet on Winner for the games we cover, checked against our numbers. When Winner pays more than a bet is worth, it shows here in green. Nothing to type in.
      </p>

      <ol className="mt-6 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
        {[
          ["We read Winner's odds", `Straight from Winner's public coupon, every three hours${index?.winner ? `. Last update ${ago(index.winner.fetchedAt)}` : ""}.`],
          ["We price every bet", "Our model, blended with Winner's own prices once its margin is taken out, gives each result a fair chance."],
          ["Green means value", `If Winner pays at least ${pct(VALUE_EDGE)} more than the fair price, it's value. Over many bets, value is what wins.`],
        ].map(([t, d], i) => (
          <li key={t} className="bg-card p-5">
            <div className="flex items-baseline gap-2.5">
              <span className="num font-display text-3xl font-extrabold text-accent">{i + 1}</span>
              <span className="font-semibold">{t}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{d}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink">Example:</span> we make a result 50%, so its fair price is 2.00. Winner pays 2.20: that's 10% more than fair, shown as{" "}
        <span className="num font-semibold text-won">+10%</span>. Value isn't a guarantee: our model can't see injuries or team news, so check the line-ups before you play,
        and remember odds on Winner move.
      </p>

      {!index ? <Loading what="Winner's odds" /> : !index.winner ? (
        <p className="mt-8 panel p-6 muted">Winner's odds aren't loaded yet. They arrive with the next data update, within three hours.</p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button className={`chip ${league === "all" ? "chip-on" : ""}`} onClick={() => setLeague("all")}>All leagues</button>
            {leagues.map(([k, n]) => <button key={k} className={`chip ${league === k ? "chip-on" : ""}`} onClick={() => setLeague(k)}>{n}</button>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded border border-line bg-card p-0.5 text-sm" role="tablist">
              <button role="tab" aria-selected={onlyValue} onClick={() => setOnlyValue(true)} className={`rounded-sm px-3 py-1.5 font-semibold ${onlyValue ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}>Value bets ({value.length})</button>
              <button role="tab" aria-selected={!onlyValue} onClick={() => setOnlyValue(false)} className={`rounded-sm px-3 py-1.5 font-semibold ${!onlyValue ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}>Every bet</button>
            </div>
            <span className="text-xs text-ink-faint">{index.winner.games} games priced by Winner</span>
          </div>

          {onlyValue && !value.length && (
            <p className="mt-4 rounded border border-line bg-well px-4 py-3 text-sm">
              No bet clears the {pct(VALUE_EDGE)} bar right now. That's normal: Winner's margin is about 10%, so value is rare. These are the closest:
            </p>
          )}

          <div className="mt-4 panel overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-xs text-ink-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 text-left font-semibold">Game</th>
                  <th className="px-3 py-3 text-left font-semibold">Bet</th>
                  <th className="px-3 py-3 text-right font-semibold">Winner pays</th>
                  <th className="px-3 py-3 text-right font-semibold">Our chance</th>
                  <th className="px-3 py-3 text-right font-semibold">Fair price</th>
                  <th className="px-3 py-3 text-right font-semibold">Value</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => {
                  const key = `${r.m.id}|W${r.market}${r.line ?? ""}|${r.sel}`;
                  const on = hasLeg(key);
                  const good = r.edge >= VALUE_EDGE;
                  return (
                    <tr key={key} className={good ? "bg-won/5" : ""}>
                      <td className="px-4 py-3">
                        <div className="text-xs text-ink-faint">{r.m.leagueName}, {dayLabel(r.m.kickoff)} {time(r.m.kickoff)}</div>
                        <Link to={`/match/${r.m.league}/${r.m.id}`} className="font-semibold hover:text-accent">{r.m.home} v {r.m.away}</Link>
                        <div dir="rtl" lang="he" className="text-left text-xs text-ink-faint">{r.m.winner!.he[0]} – {r.m.winner!.he[1]}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div>{r.label}{r.market === "1X2" || r.market === "Winner" ? (r.sel === "X" ? "" : " to win") : ""}</div>
                        <div className="text-xs text-ink-faint">{r.market === "1X2" ? "Result" : r.market === "Goals" ? "Total goals" : r.market === "Points" ? "Total points" : r.market}</div>
                      </td>
                      <td className="num px-3 py-3 text-right text-base font-semibold">{r.odds.toFixed(2)}</td>
                      <td className="num px-3 py-3 text-right text-ink-muted">{pct(r.p)}</td>
                      <td className="num px-3 py-3 text-right text-ink-muted">{fair(r.p)}</td>
                      <td className={`num px-3 py-3 text-right ${good ? "font-bold text-won" : "text-ink-faint"}`}>{signedPct(r.edge)}</td>
                      <td className="px-4 py-3 text-right">
                        <button className={`chip ${on ? "chip-on" : ""}`} aria-pressed={on}
                          onClick={() => on ? removeLeg(key) : addLeg({ key, matchId: r.m.id, league: r.m.league!, event: `${r.m.home} v ${r.m.away}`, kickoff: r.m.kickoff, market: r.market, selection: r.sel, label: r.label, modelP: r.p, odds: r.odds })}>
                          {on ? <Check size={12} /> : <Plus size={12} />} Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">
            Odds are copied from Winner's public site and can change at any time; always check the price on Winner before you play. We're not affiliated with Winner or the Israel Sports Betting Board.
          </p>
        </>
      )}
    </>
  );
}
