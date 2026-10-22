import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useIndex, useLeague } from "@/lib/data";
import { ago } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import { leagueStyle } from "@/lib/leagueStyle";
import { Board } from "@/components/Board";
import { Loading, LeagueBadge } from "@/components/bits";
import { HowToRead } from "@/components/HowToRead";
import { PageHero } from "@/components/PageHero";
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

  const leagues = (index?.leagues ?? []).filter((l) => l.upcoming > 0);
  const pick = (k: string) => setParams(k === "all" ? {} : { league: k });
  const meta = index?.leagues.find((l) => l.key === key);
  const style = key === "all" ? { color: "#0D1B14", deep: "#0E5A3A" } : leagueStyle(key);
  const values = matches.filter((m) => m.winner?.edge?.some((e) => e >= VALUE_EDGE)).length;
  const priced = matches.filter((m) => m.winner).length;

  return (
    <>
      <PageHero
        eyebrow="Fixtures"
        title={key === "all" ? "The week on the coupon" : meta?.name ?? "Fixtures"}
        intro={`Every game with our chance of each result and Winner's odds. Pick a competition, pick a day, tap a price to put it on your ticket.${meta ? ` Data updated ${ago(meta.fetchedAt)}.` : ""}`}
        color={style.color} deep={style.deep}
        badge={key !== "all" ? <LeagueBadge league={key} size={96} /> : undefined}
        stats={[[matches.length, key === "all" ? "games, next 8 days" : "games, next 3 weeks"], [priced, "priced by Winner"], [values, "value bets"]]}
      >
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <Tile on={key === "all"} onClick={() => pick("all")} code="ALL" color="#FFFFFF" ink="#0D1B14" name="Everything" />
          {leagues.map((l) => {
            const s = leagueStyle(l.key);
            return <Tile key={l.key} on={key === l.key} onClick={() => pick(l.key)} code={s.code} color={s.color} name={l.name} count={l.upcoming} />;
          })}
        </div>
      </PageHero>

      <HowToRead className="mt-8" />

      <div className="mt-8">
        {!index || (key !== "all" && !league) ? <Loading what="fixtures" /> : matches.length === 0 ? (
          <p className="panel p-6 muted">No upcoming games here yet. Fixtures appear as soon as they're scheduled.</p>
        ) : <Board key={key} matches={matches} leagueFilter={key === "all"} />}
      </div>
    </>
  );
}

function Tile({ on, onClick, code, color, ink = "#FFFFFF", name, count }: { on: boolean; onClick: () => void; code: string; color: string; ink?: string; name: string; count?: number }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`flex shrink-0 items-center gap-2.5 rounded-lg border py-2 pl-2 pr-3.5 text-left transition-all
        ${on ? "border-white bg-white text-ink shadow-lg" : "border-white/20 bg-white/[0.07] text-white hover:bg-white/15"}`}>
      <span className="grid h-8 w-8 place-items-center rounded-md font-display text-xs font-extrabold" style={{ background: color, color: ink, boxShadow: "inset 0 -2px 0 rgba(0,0,0,.25)" }}>{code}</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">{name}</span>
        {count !== undefined && <span className={`block text-[11px] ${on ? "text-ink-muted" : "text-white/55"}`}>{count} games</span>}
      </span>
    </button>
  );
}
