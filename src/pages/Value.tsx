import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIndex } from "@/lib/data";
import { dayLabel, time, fair, pct, edge, signedPct } from "@/lib/format";
import { isBasketModel, isFootballModel, type Match } from "@/lib/types";
import { Loading } from "@/components/bits";

// Type the Winner odds you see on the coupon; we show where they pay more than our model says
// they should. Winner's prices aren't in any free feed, so the reader brings them.
const KEY = "lu.winnerOdds";
type OddsMap = Record<string, string>; // `${matchId}|${sel}` -> typed odds
const THRESHOLD = 0.05;

export default function Value() {
  const { data: index } = useIndex();
  const [league, setLeague] = useState("all");
  const [odds, setOdds] = useState<OddsMap>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(odds)); } catch { /* ignore */ } }, [odds]);

  const matches = useMemo(() => (index?.upcoming ?? []).filter((m) => m.model && (league === "all" || m.league === league)), [index, league]);
  const flags = useMemo(() => {
    const out: { m: Match; sel: string; p: number; o: number; e: number }[] = [];
    for (const m of index?.upcoming ?? []) {
      for (const [sel, p] of outcomes(m)) {
        const o = Number(odds[`${m.id}|${sel}`]);
        if (o > 1 && edge(p, o) >= THRESHOLD) out.push({ m, sel, p, o, e: edge(p, o) });
      }
    }
    return out.sort((a, b) => b.e - a.e);
  }, [index, odds]);

  return (
    <>
      <h1 className="h1">Value finder</h1>
      <p className="mt-3 max-w-2xl muted">
        Type in the odds Winner is offering. Where Winner pays more than our fair price, the bet has value: over many bets, value is what wins.
        Your odds stay in this browser.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button className={`chip ${league === "all" ? "chip-on" : ""}`} onClick={() => setLeague("all")}>All leagues</button>
            {index?.leagues.filter((l) => l.upcoming).map((l) => (
              <button key={l.key} className={`chip ${league === l.key ? "chip-on" : ""}`} onClick={() => setLeague(l.key)}>{l.name}</button>
            ))}
          </div>
          {!index ? <Loading what="fixtures" /> : (
            <div className="panel divide-y divide-ink-line">
              {matches.length === 0 && <p className="p-6 muted">No priced games in the next eight days for this league.</p>}
              {matches.map((m) => (
                <div key={m.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="text-xs text-chalk-faint">{m.leagueName}, {dayLabel(m.kickoff)} {time(m.kickoff)}</div>
                    <Link to={`/match/${m.league}/${m.id}`} className="font-semibold hover:text-amber">{m.home} v {m.away}</Link>
                  </div>
                  <div className="flex gap-2">
                    {outcomes(m).map(([sel, p]) => {
                      const k = `${m.id}|${sel}`;
                      const o = Number(odds[k]);
                      const e = o > 1 ? edge(p, o) : null;
                      return (
                        <label key={sel} className="flex w-[5.5rem] flex-col gap-1 text-xs">
                          <span className="flex justify-between muted"><span className="font-bold text-chalk">{sel}</span><span className="num">fair {fair(p)}</span></span>
                          <input
                            inputMode="decimal"
                            placeholder="Winner"
                            value={odds[k] ?? ""}
                            onChange={(ev) => setOdds((x) => ({ ...x, [k]: ev.target.value.replace(",", ".") }))}
                            className={`num w-full rounded-lg border bg-ink-sunk px-2 py-1.5 text-sm outline-none focus:border-amber ${e !== null && e >= THRESHOLD ? "border-amber text-amber" : "border-ink-line"}`}
                            aria-label={`Winner odds for ${sel === "1" ? m.home : sel === "2" ? m.away : "draw"}`}
                          />
                          <span className={`num h-4 ${e === null ? "" : e >= THRESHOLD ? "text-amber font-semibold" : e >= 0 ? "muted" : "text-chalk-faint"}`}>
                            {e === null ? "" : signedPct(e)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="panel p-5 lg:sticky lg:top-32">
          <h2 className="h3">Value on your coupon</h2>
          {flags.length === 0 ? (
            <p className="mt-2 text-sm muted">Nothing yet. A result shows here when Winner's odds beat our fair price by {pct(THRESHOLD)} or more.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink-line">
              {flags.map((f) => (
                <li key={`${f.m.id}${f.sel}`} className="py-3 text-sm">
                  <div className="font-semibold">{f.sel === "1" ? f.m.home : f.sel === "2" ? f.m.away : "Draw"} <span className="text-chalk-faint font-normal">in {f.m.home} v {f.m.away}</span></div>
                  <div className="num mt-0.5 muted">Winner {f.o.toFixed(2)}, fair {fair(f.p)}, <span className="font-semibold text-amber">{signedPct(f.e)} value</span></div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-ink-line pt-4 text-xs text-chalk-faint">
            Value is the model's opinion, not a promise. Small edges on long odds lose often in the short run. Stake small and the same each time.
          </p>
        </aside>
      </div>
    </>
  );
}

function outcomes(m: Match): [string, number][] {
  if (isFootballModel(m.model)) return [["1", m.model["1x2"]["1"]], ["X", m.model["1x2"].X], ["2", m.model["1x2"]["2"]]];
  if (isBasketModel(m.model)) return [["1", m.model.win["1"]], ["2", m.model.win["2"]]];
  return [];
}
