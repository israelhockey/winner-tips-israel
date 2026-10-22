import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useIndex } from "@/lib/data";
import { dayLabel, time } from "@/lib/format";
import { leagueStyle } from "@/lib/leagueStyle";
import { Loading } from "@/components/bits";
import { PageHero } from "@/components/PageHero";
import type { LeagueSummary } from "@/lib/types";

export default function Leagues() {
  const { data } = useIndex();
  if (!data) return <Loading what="leagues" />;
  const groups: [string, LeagueSummary[]][] = [
    ["Israel", data.leagues.filter((l) => l.country === "Israel")],
    ["European football", data.leagues.filter((l) => l.sport === "football" && l.country !== "Israel")],
    ["Basketball", data.leagues.filter((l) => l.sport === "basketball" && l.country !== "Israel")],
  ];
  const played = data.leagues.reduce((s, l) => s + l.played, 0);
  return (
    <>
      <PageHero eyebrow="Leagues" title="Every competition on the coupon"
        intro="Tables, power ratings, results and model prices for every league and cup we cover, from Ligat Winner to the NBA."
        color="#0E5A3A" deep="#0D1B14"
        stats={[[data.leagues.length, "competitions"], [played.toLocaleString("en-GB"), "games played this season"], [data.upcoming.length, "games this week"]]} />
      {groups.filter(([, ls]) => ls.length).map(([title, ls]) => (
        <section key={title} className="mt-12">
          <h2 className="h2 mb-4">{title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ls.map((l) => {
              const s = leagueStyle(l.key);
              return (
                <Link key={l.key} to={`/leagues/${l.key}`}
                  className="group relative isolate flex min-h-[12rem] flex-col gap-6 justify-between overflow-hidden rounded-card p-5 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-1"
                  style={{ background: `linear-gradient(125deg, ${s.color} 0%, ${s.color} 50%, ${s.deep} 100%)` }}>
                  <span className="stage-grain absolute inset-0 -z-10" />
                  <span className="absolute -bottom-6 -right-2 -z-10 font-display text-[9rem] font-extrabold leading-none text-white/10 transition-transform duration-500 group-hover:-translate-y-2">{s.code}</span>
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-semibold">{l.country}{l.cup ? " · cup" : ""}</span>
                    <ArrowUpRight className="opacity-60 transition-opacity group-hover:opacity-100" size={20} />
                  </div>
                  <div>
                    <div className="font-display text-[2.4rem] font-extrabold leading-[0.9]">{l.name}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-white/75">
                      <span className="num">{l.played} played</span>
                      <span className="num">{l.upcoming} coming up</span>
                      {l.nextKickoff && <span>Next {dayLabel(l.nextKickoff)} {time(l.nextKickoff)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
