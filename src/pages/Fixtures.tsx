import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useIndex, useLeague } from "@/lib/data";
import { ago } from "@/lib/format";
import { Board } from "@/components/Board";
import { Loading } from "@/components/bits";
import { HowToRead } from "@/components/HowToRead";
import type { Match } from "@/lib/types";

// Every upcoming game with model prices. One league at a time shows three weeks ahead;
// "All" shows the next eight days across every league.
export default function Fixtures() {
  const [params, setParams] = useSearchParams();
  const key = params.get("league") ?? "all";
  const { data: index } = useIndex();
  const { data: league } = useLeague(key === "all" ? undefined : key);

  const matches: Match[] = useMemo(() => {
    if (key === "all") return index?.upcoming ?? [];
    return (league?.upcoming ?? []).map((m) => ({ ...m, league: key, leagueName: league?.name, sport: league?.sport }));
  }, [key, index, league]);


  const football = index?.leagues.filter((l) => l.sport === "football") ?? [];
  const basket = index?.leagues.filter((l) => l.sport === "basketball") ?? [];
  const pick = (k: string) => setParams(k === "all" ? {} : { league: k });
  const meta = index?.leagues.find((l) => l.key === key);

  return (
    <>
      <h1 className="h1">Fixtures and model odds</h1>
      <p className="mt-3 max-w-2xl muted">
        Every game we cover with our chance of each result and Winner's odds. Pick a league, pick a day, tap a price to add it to your ticket, or open a game for the full preview.
      </p>

      <HowToRead className="mt-6" />

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${key === "all" ? "chip-on" : ""}`} onClick={() => pick("all")}>All, next 8 days</button>
          {football.map((l) => <button key={l.key} className={`chip ${key === l.key ? "chip-on" : ""}`} onClick={() => pick(l.key)}>{l.name}</button>)}
        </div>
        {basket.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {basket.map((l) => <button key={l.key} className={`chip ${key === l.key ? "chip-on" : ""}`} onClick={() => pick(l.key)}>{l.name}</button>)}
          </div>
        )}
      </div>
      {meta && <p className="mt-4 text-xs text-ink-faint">Data updated {ago(meta.fetchedAt)}</p>}

      <div className="mt-8">
        {!index || (key !== "all" && !league) ? <Loading what="fixtures" /> : matches.length === 0 ? (
          <p className="panel p-6 muted">No upcoming games here yet. Fixtures appear as soon as they're scheduled.</p>
        ) : <Board key={key} matches={matches} leagueFilter={false} />}
      </div>
    </>
  );
}
