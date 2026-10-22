import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIndex, useRecord } from "@/lib/data";
import { TAGLINE, FREE_PICKS_PER_WEEK } from "@/lib/config";
import { useApp } from "@/lib/state";
import { unlockedIds } from "@/lib/access";
import { dayKey, dayLabel, pct } from "@/lib/format";
import { FixtureRow } from "@/components/FixtureRow";
import { PickCard } from "@/components/PickCard";
import { Section, TextLink, Loading } from "@/components/bits";

export default function Home() {
  const { data: index, error } = useIndex();
  const { data: record } = useRecord();
  const { tier } = useApp();
  const [league, setLeague] = useState<string>("all");

  const pending = record?.picks.filter((p) => p.result === "pending") ?? [];
  const open = record ? unlockedIds(record.picks, tier) : new Set<string>();
  const headline = pending.find((p) => p.tier === "free") ?? pending[0];

  const leagues = useMemo(() => (index?.leagues ?? []).filter((l) => l.upcoming > 0)
    .sort((a, b) => Number(b.featured) - Number(a.featured)), [index]);
  const board = useMemo(() => {
    const ups = (index?.upcoming ?? []).filter((m) => league === "all" || m.league === league);
    return ups.slice(0, 14);
  }, [index, league]);
  const byDay = useMemo(() => {
    const g = new Map<string, typeof board>();
    for (const m of board) { const k = dayKey(m.kickoff); g.set(k, [...(g.get(k) ?? []), m]); }
    return [...g.values()];
  }, [board]);
  const checked = (index?.leagues ?? []).filter((l) => l.check).sort((a, b) => (b.check!.baselineBrier - b.check!.brier) - (a.check!.baselineBrier - a.check!.brier));

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div className="pt-2">
          <h1 className="h1 max-w-[16ch]">{TAGLINE}</h1>
          <p className="mt-5 max-w-xl text-lg text-chalk/80">
            Previews and picks for every game on the Winner coupon, from Ligat Winner to the Champions League,
            priced by our own model and graded in public. Free members get {FREE_PICKS_PER_WEEK} Pro picks a week.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/picks" className="btn-primary">See this week's picks</Link>
            <Link to="/membership" className="btn-quiet">Join free</Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-line pt-6">
            <div><dt className="text-xs muted">Leagues covered</dt><dd className="wide num mt-1 text-2xl font-bold">{index?.leagues.length ?? "–"}</dd></div>
            <div><dt className="text-xs muted">Games this week</dt><dd className="wide num mt-1 text-2xl font-bold">{index?.upcoming.length ?? "–"}</dd></div>
            <div><dt className="text-xs muted">Picks on the record</dt><dd className="wide num mt-1 text-2xl font-bold">{index?.record.picks ?? "–"}</dd></div>
          </dl>
        </div>

        <div>
          {headline ? (
            <>
              <p className="mb-3 text-sm font-semibold muted">Next pick on the card</p>
              <PickCard pick={headline} locked={!open.has(headline.id)} />
            </>
          ) : (
            <NextUp />
          )}
        </div>
      </div>

      <Section title="On the board this week" action={<TextLink to="/fixtures">All fixtures</TextLink>}>
        <div className="mb-4 flex flex-wrap gap-2">
          <button className={`chip ${league === "all" ? "chip-on" : ""}`} onClick={() => setLeague("all")}>All leagues</button>
          {leagues.map((l) => (
            <button key={l.key} className={`chip ${league === l.key ? "chip-on" : ""}`} onClick={() => setLeague(l.key)}>{l.name}</button>
          ))}
        </div>
        {error ? <p className="muted">Couldn't load fixtures. Refresh to try again.</p> : !index ? <Loading what="fixtures" /> : board.length === 0 ? (
          <p className="panel p-6 muted">No games in the next eight days for this league.</p>
        ) : (
          <div className="space-y-6">
            {byDay.map((ms) => (
              <div key={ms[0].kickoff}>
                <h3 className="mb-2 text-sm font-semibold muted">{dayLabel(ms[0].kickoff)}</h3>
                <div className="panel">{ms.map((m) => <FixtureRow key={m.id} m={m} leagueKey={m.league!} showLeague={league === "all"} />)}</div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-chalk-faint">
          Bars show our model's chance of each result; the small number is the fair price with no bookmaker margin.
          If Winner offers more than the fair price, that's value. Check it in the <Link className="underline underline-offset-2" to="/value">value finder</Link>.
        </p>
      </Section>

      {checked.length > 0 && (
        <Section title="The model, checked" action={<TextLink to="/how-it-works">How it works</TextLink>}>
          <p className="mb-5 max-w-2xl muted">
            Before trusting a number, we test it. For every league below, the model predicted each game using only what it knew beforehand.
            A lower Brier score means sharper predictions; the baseline is simply guessing each league's usual home, draw and away rates.
          </p>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs muted">
                <tr className="border-b border-ink-line">
                  <th className="px-4 py-3 font-semibold">League</th>
                  <th className="px-4 py-3 text-right font-semibold">Games tested</th>
                  <th className="px-4 py-3 text-right font-semibold">Favourite won</th>
                  <th className="px-4 py-3 text-right font-semibold">Brier, model</th>
                  <th className="px-4 py-3 text-right font-semibold">Brier, baseline</th>
                </tr>
              </thead>
              <tbody className="num">
                {checked.map((l) => (
                  <tr key={l.key} className="border-b border-ink-line last:border-0">
                    <td className="px-4 py-3 font-semibold"><Link className="hover:text-amber" to={`/leagues/${l.key}`}>{l.name}</Link></td>
                    <td className="px-4 py-3 text-right">{l.check!.matches}</td>
                    <td className="px-4 py-3 text-right">{pct(l.check!.hitRate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-won">{l.check!.brier.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right muted">{l.check!.baselineBrier.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );

  function NextUp() {
    const il = index?.upcoming.filter((m) => m.league === "il-premier").slice(0, 4) ?? [];
    const list = il.length ? il : index?.upcoming.slice(0, 4) ?? [];
    return (
      <div>
        <p className="mb-3 text-sm font-semibold muted">{il.length ? "Ligat Winner, next up" : "Next up"}</p>
        <div className="panel">
          {!index ? <Loading what="fixtures" /> : list.map((m) => <FixtureRow key={m.id} m={m} leagueKey={m.league!} showLeague={!il.length} compact />)}
        </div>
      </div>
    );
  }
}
