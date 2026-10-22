import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIndex, useRecord } from "@/lib/data";
import { FREE_PICKS_PER_WEEK } from "@/lib/config";
import { useApp } from "@/lib/state";
import { unlockedIds } from "@/lib/access";
import { dayKey, dayLabel, pct } from "@/lib/format";
import { FixtureRow } from "@/components/FixtureRow";
import { PickCard } from "@/components/PickCard";
import { Coupon } from "@/components/Coupon";
import { Ticker } from "@/components/Ticker";
import { Section, TextLink, Loading } from "@/components/bits";
import type { Match } from "@/lib/types";

export default function Home() {
  const { data: index, error } = useIndex();
  const { data: record } = useRecord();
  const { tier } = useApp();
  const [league, setLeague] = useState<string>("all");

  const pending = record?.picks.filter((p) => p.result === "pending") ?? [];
  const open = record ? unlockedIds(record.picks, tier) : new Set<string>();

  const leagues = useMemo(() => (index?.leagues ?? []).filter((l) => l.upcoming > 0)
    .sort((a, b) => Number(b.featured) - Number(a.featured)), [index]);
  const board = useMemo(() => (index?.upcoming ?? []).filter((m) => league === "all" || m.league === league).slice(0, 16), [index, league]);
  const byDay = useMemo(() => {
    const g = new Map<string, Match[]>();
    for (const m of board) { const k = dayKey(m.kickoff); g.set(k, [...(g.get(k) ?? []), m]); }
    return [...g.values()];
  }, [board]);
  const israel = (index?.upcoming ?? []).filter((m) => m.league === "il-premier");
  const couponGames = (israel.length >= 3 ? israel : index?.upcoming ?? []).slice(0, 6);
  const checked = (index?.leagues ?? []).filter((l) => l.check)
    .sort((a, b) => (b.check!.baselineBrier - b.check!.brier) - (a.check!.baselineBrier - a.check!.brier));

  return (
    <>
      {/* Hero: the pitch, and this week's coupon */}
      <section className="pitch-bg bleed relative -mt-12 overflow-hidden text-white">
        <PitchLines />
        <div className="relative mx-auto grid max-w-page grid-cols-1 items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-marker">Ligat Winner to the Champions League</p>
            <h1 className="mt-3 font-display text-[3.4rem] font-extrabold leading-[0.92] sm:text-[4.6rem] lg:text-[5.6rem]">
              Every game on the Winner coupon, priced in English.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Our model puts a fair price on every result. Our tipsters mark the ones worth playing, and every pick stays on a public record, won or lost.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/picks" className="btn-marker px-5 py-3 text-base">See this week's picks</Link>
              <Link to="/membership" className="btn border border-white/40 px-5 py-3 text-base text-white hover:bg-white/10">Join free</Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              <Fig n={index?.leagues.length} label="leagues covered" />
              <Fig n={index?.upcoming.length} label="games this week" />
              <Fig n={FREE_PICKS_PER_WEEK} label="free Pro picks a week" />
            </dl>
          </div>
          <div className="flex min-w-0 justify-center px-1 lg:justify-end">
            {couponGames.length ? <Coupon title={israel.length >= 3 ? "Ligat Winner coupon" : "This week's coupon"} matches={couponGames} /> : <div className="h-96" />}
          </div>
        </div>
      </section>
      {index && <Ticker matches={index.upcoming} />}

      {pending.length > 0 && (
        <Section title="On the card" action={<TextLink to="/picks">All picks</TextLink>}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pending.slice(0, 3).map((p) => <PickCard key={p.id} pick={p} locked={!open.has(p.id)} />)}
          </div>
        </Section>
      )}

      <Section title="This week's board" action={<TextLink to="/fixtures">All fixtures</TextLink>} className="mt-14">
        <p className="-mt-1 mb-5 max-w-2xl muted">
          Our chance of each result, with the fair price in the corner. The highlighted box is the most likely result. Tap any box to put it on your ticket.
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          <button className={`chip ${league === "all" ? "chip-on" : ""}`} onClick={() => setLeague("all")}>All leagues</button>
          {leagues.map((l) => (
            <button key={l.key} className={`chip ${league === l.key ? "chip-on" : ""}`} onClick={() => setLeague(l.key)}>{l.name}</button>
          ))}
        </div>
        {error ? <p className="muted">Couldn't load fixtures. Refresh to try again.</p> : !index ? <Loading what="fixtures" /> : board.length === 0 ? (
          <p className="panel p-6 muted">No games in the next eight days for this league.</p>
        ) : (
          <div className="space-y-8">
            {byDay.map((ms) => (
              <div key={ms[0].kickoff}>
                <h3 className="mb-2 font-display text-xl font-bold">{dayLabel(ms[0].kickoff)}</h3>
                <div className="panel">{ms.map((m) => <FixtureRow key={m.id} m={m} leagueKey={m.league!} showLeague={league === "all"} />)}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <section className="bleed mt-20 bg-card">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 md:grid-cols-3 md:px-6">
          {[
            ["Locked", "Each pick goes up before kickoff with Winner's odds at that moment. From then on it can't be edited or deleted."],
            ["Played", "The game is played. Free and Pro picks sit in the same ledger, so nothing can be cherry-picked afterwards."],
            ["Graded", "After the final whistle the pick is settled automatically from the result, and the record updates for everyone to see."],
          ].map(([t, d], i) => (
            <div key={t}>
              <div className="flex items-baseline gap-3">
                <span className="num font-display text-5xl font-extrabold text-accent">{i + 1}</span>
                <h3 className="font-display text-3xl font-extrabold">{t}</h3>
              </div>
              <p className="mt-3 max-w-sm leading-relaxed text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {checked.length > 0 && (
        <Section title="The model, checked" action={<TextLink to="/how-it-works">How it works</TextLink>} className="mt-16">
          <p className="mb-6 max-w-2xl muted">
            We tested the model on past games using only what it knew beforehand. The bar is how much sharper it was than a baseline
            that only knows each league's usual home, draw and away rates (Brier score, lower is better).
          </p>
          <div className="panel divide-y divide-line">
            {checked.map((l) => {
              const gain = (l.check!.baselineBrier - l.check!.brier) / l.check!.baselineBrier;
              const best = (checked[0].check!.baselineBrier - checked[0].check!.brier) / checked[0].check!.baselineBrier;
              return (
                <Link key={l.key} to={`/leagues/${l.key}`} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-4 px-5 py-3 hover:bg-hover sm:grid-cols-[12rem_1fr_7rem_7rem]">
                  <span className="truncate font-semibold">{l.name}</span>
                  <span className="h-3 rounded-sm bg-paper"><span className="block h-3 rounded-sm bg-accent" style={{ width: `${(gain / best) * 100}%` }} /></span>
                  <span className="num text-right text-sm font-semibold">{pct(gain, 1)} sharper</span>
                  <span className="num hidden text-right text-sm muted sm:block">{l.check!.matches} games</span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      <section className="pitch-bg bleed relative mt-20 -mb-24 overflow-hidden text-white">
        <PitchLines />
        <div className="relative mx-auto flex max-w-page flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-none md:text-5xl">Start with {FREE_PICKS_PER_WEEK} Pro picks a week, free.</h2>
            <p className="mt-3 max-w-lg text-white/80">Check the record first. Join when it has earned it.</p>
          </div>
          <Link to="/membership" className="btn-marker shrink-0 whitespace-nowrap px-6 py-3 text-base">Join free</Link>
        </div>
      </section>
    </>
  );
}

function Fig({ n, label }: { n: number | undefined; label: string }) {
  return (
    <div>
      <dd className="num font-display text-4xl font-extrabold leading-none sm:text-5xl">{n ?? "–"}</dd>
      <dt className="mt-1 text-sm text-white/70">{label}</dt>
    </div>
  );
}

// Faint pitch markings: halfway line, centre circle and a penalty box, at the right of the band.
function PitchLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 600" aria-hidden>
      <g fill="none" stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="2">
        <line x1="760" y1="0" x2="760" y2="600" />
        <circle cx="760" cy="300" r="120" />
        <circle cx="760" cy="300" r="4" fill="#FFFFFF" fillOpacity="0.15" />
        <rect x="1020" y="120" width="180" height="360" />
        <rect x="1130" y="210" width="70" height="180" />
        <path d="M1020 240 A 70 70 0 0 0 1020 360" />
      </g>
    </svg>
  );
}
