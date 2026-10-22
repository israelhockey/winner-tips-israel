
import { Link } from "react-router-dom";
import { useIndex, useRecord } from "@/lib/data";
import { FREE_PICKS_PER_WEEK } from "@/lib/config";
import { useApp } from "@/lib/state";
import { unlockedIds } from "@/lib/access";
import { pct } from "@/lib/format";
import { Board } from "@/components/Board";
import { PickCard } from "@/components/PickCard";
import { Stage, chances } from "@/components/Stage";
import { Ticker } from "@/components/Ticker";
import { HowToRead } from "@/components/HowToRead";
import { ValueStrip } from "@/components/ValueStrip";
import { Section, TextLink, Loading } from "@/components/bits";

export default function Home() {
  const { data: index, error } = useIndex();
  const { data: record } = useRecord();
  const { tier } = useApp();

  const pending = record?.picks.filter((p) => p.result === "pending") ?? [];
  const open = record ? unlockedIds(record.picks, tier) : new Set<string>();

  // Game of the day: the next Ligat Winner game, else the next big European one.
  const soon = (index?.upcoming ?? []).filter((m) => chances(m) && Date.parse(m.kickoff) > Date.now() && Date.parse(m.kickoff) < Date.now() + 4 * 86400e3);
  const gameOfDay = ["il-premier", "ucl", "uel", "epl", "laliga", "il-basket", "euroleague"]
    .map((k) => soon.filter((m) => m.league === k).sort((a, b) => (b.winner ? 1 : 0) - (a.winner ? 1 : 0))[0]).find(Boolean) ?? soon[0];
  const checked = (index?.leagues ?? []).filter((l) => l.check)
    .sort((a, b) => (b.check!.baselineBrier - b.check!.brier) - (a.check!.baselineBrier - a.check!.brier));

  return (
    <>
      {/* Hero: the game of the day, full stage */}
      <div className="bleed -mt-12">
        {gameOfDay ? (
          <Stage m={gameOfDay} active className="min-h-[calc(100svh-6.5rem)]">
            <div className="relative mx-auto mt-6 w-full max-w-page px-4 text-white md:px-8">
              <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white/80">Game of the day</p>
            </div>
          </Stage>
        ) : <div className="h-[70svh] bg-ink" />}
      </div>
      <section className="bleed bg-ink text-white">
        <div className="mx-auto grid max-w-page items-end gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h1 className="font-display text-[3rem] font-extrabold leading-[0.9] sm:text-7xl">Every game on the Winner coupon, <span className="text-marker">priced in English.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              Our model puts a fair price on every result and checks it against Winner's odds. Our tipsters mark the ones worth playing, and every pick stays on a public record.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/matchday" className="btn-marker px-6 py-3.5 text-base">Play matchday</Link>
              <Link to="/value" className="btn border border-white/35 px-5 py-3.5 text-base text-white hover:bg-white/10">Value finder</Link>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-6">
            <Fig n={index?.leagues.length} label="leagues covered" />
            <Fig n={index?.upcoming.length} label="games this week" />
            <Fig n={FREE_PICKS_PER_WEEK} label="free Pro picks a week" />
          </dl>
        </div>
      </section>
      {index && <Ticker matches={index.upcoming} />}

      {index?.winner && (
        <Section title="Best value on Winner" action={<TextLink to="/value">Value finder</TextLink>} className="mt-14">
          <ValueStrip matches={index.upcoming} fetchedAt={index.winner.fetchedAt} />
        </Section>
      )}

      {pending.length > 0 && (
        <Section title="On the card" action={<TextLink to="/picks">All picks</TextLink>}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pending.slice(0, 3).map((p) => <PickCard key={p.id} pick={p} locked={!open.has(p.id)} />)}
          </div>
        </Section>
      )}

      <Section title="This week's board" action={<TextLink to="/fixtures">All fixtures</TextLink>} className="mt-14">
        <p className="-mt-1 mb-5 max-w-2xl muted">
          Every game, one day at a time. The bar shows each result's chance in the clubs' colours; underneath are Winner's odds, with value in green. Tap a price to put it on your ticket.
        </p>
        <HowToRead className="mb-6" />
        {error ? <p className="muted">Couldn't load fixtures. Refresh to try again.</p> : !index ? <Loading what="fixtures" /> : <Board matches={index.upcoming} />}
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
