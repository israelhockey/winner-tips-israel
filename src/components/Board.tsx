import { useMemo, useState } from "react";
import { MatchCard } from "./MatchCard";
import { LeagueBadge } from "./bits";
import { dayKey, dayLabel } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import type { Match } from "@/lib/types";

const FIRST = ["il-premier", "il-basket", "ucl", "uel", "uecl", "epl", "laliga", "seriea", "bundesliga", "ligue1", "euroleague"];
const rank = (k: string) => { const i = FIRST.indexOf(k); return i < 0 ? 99 : i; };
const short = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", weekday: "short" });
const dnum = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", day: "numeric", month: "short" });

// Games one day at a time, like a sports app: a strip of days, an optional league filter,
// and the day's games as cards grouped by competition (Israeli first).
export function Board({ matches, leagueFilter = true }: { matches: Match[]; leagueFilter?: boolean }) {
  const days = useMemo(() => {
    const g = new Map<string, Match[]>();
    for (const m of matches) { const k = dayKey(m.kickoff); g.set(k, [...(g.get(k) ?? []), m]); }
    return [...g.entries()];
  }, [matches]);
  const [day, setDay] = useState<string | null>(null);
  const [league, setLeague] = useState("all");
  const current = days.find(([k]) => k === day) ?? days[0];
  if (!current) return <p className="panel p-6 muted">No games in the coming days.</p>;

  const inDay = current[1];
  const leagues = [...new Map(inDay.map((m) => [m.league!, m.leagueName!])).entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  const shown = inDay.filter((m) => league === "all" || m.league === league);
  const groups = [...new Map(leagues.map(([k, n]) => [k, { name: n, list: shown.filter((m) => m.league === k) }])).entries()].filter(([, g]) => g.list.length);

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Day">
        {days.map(([k, ms]) => {
          const on = k === current[0];
          const values = ms.filter((m) => m.winner?.edge?.some((e) => e >= VALUE_EDGE)).length;
          const label = dayLabel(ms[0].kickoff);
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => { setDay(k); setLeague("all"); }}
              className={`relative flex min-w-[5.5rem] shrink-0 flex-col items-start rounded-card border px-3.5 py-2.5 text-left transition-colors
                ${on ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink-faint"}`}>
              <span className="font-display text-lg font-extrabold leading-none">{label === "Today" || label === "Tomorrow" ? label : short.format(new Date(ms[0].kickoff))}</span>
              <span className={`mt-1 text-[11px] ${on ? "text-paper/70" : "text-ink-faint"}`}>{label === "Today" || label === "Tomorrow" ? dnum.format(new Date(ms[0].kickoff)) : dnum.format(new Date(ms[0].kickoff))} · {ms.length}</span>
              {values > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-won" title={`${values} value`} />}
            </button>
          );
        })}
      </div>

      {leagueFilter && leagues.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={`chip ${league === "all" ? "chip-on" : ""}`} onClick={() => setLeague("all")}>All · {inDay.length}</button>
          {leagues.map(([k, n]) => (
            <button key={k} className={`chip ${league === k ? "chip-on" : ""}`} onClick={() => setLeague(k)}>{n} · {inDay.filter((m) => m.league === k).length}</button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-8">
        {groups.map(([k, g]) => (
          <section key={k}>
            <h3 className="mb-4 flex items-center gap-3 font-display text-2xl font-extrabold">
              <LeagueBadge league={k} size={30} />{g.name}<span className="h-px flex-1 bg-line" /><span className="font-sans text-xs font-medium text-ink-faint">{g.list.length} game{g.list.length === 1 ? "" : "s"}</span>
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {g.list.map((m) => <MatchCard key={m.id} m={m} leagueKey={m.league!} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
