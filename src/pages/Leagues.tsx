import { Link } from "react-router-dom";
import { useIndex } from "@/lib/data";
import { dayLabel, time, ago } from "@/lib/format";
import { Loading } from "@/components/bits";
import type { LeagueSummary } from "@/lib/types";

export default function Leagues() {
  const { data } = useIndex();
  if (!data) return <Loading what="leagues" />;
  const groups: [string, LeagueSummary[]][] = [
    ["Israel", data.leagues.filter((l) => l.country === "Israel")],
    ["European football", data.leagues.filter((l) => l.sport === "football" && l.country !== "Israel")],
    ["Basketball", data.leagues.filter((l) => l.sport === "basketball" && l.country !== "Israel")],
  ];
  return (
    <>
      <h1 className="h1">Leagues</h1>
      <p className="mt-3 max-w-2xl muted">Tables, power ratings, results and model prices for every competition we cover on the Winner coupon.</p>
      {groups.filter(([, ls]) => ls.length).map(([title, ls]) => (
        <section key={title} className="mt-10">
          <h2 className="h2 mb-4">{title}</h2>
          <div className="panel divide-y divide-ink-line">
            {ls.map((l) => (
              <Link key={l.key} to={`/leagues/${l.key}`} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-ink-hover md:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div>
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-xs muted">{l.country}, {l.season.replace("-20", "/").replace("-", "/")}</div>
                </div>
                <div className="hidden text-sm muted md:block num">{l.played} played this season</div>
                <div className="hidden text-sm muted md:block num">{l.nextKickoff ? `Next: ${dayLabel(l.nextKickoff)} ${time(l.nextKickoff)}` : "No games scheduled"}</div>
                <div className="text-xs text-chalk-faint">Updated {ago(l.fetchedAt)}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
