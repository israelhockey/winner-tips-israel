import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { useLeague } from "@/lib/data";
import { dayLabel, time, fair, pct, ago, signedPct } from "@/lib/format";
import { isBasketModel, isFootballModel, type League, type Match, type WinnerMarket } from "@/lib/types";
import { VALUE_EDGE } from "@/lib/config";
import { useApp } from "@/lib/state";
import { CouponBoxes } from "@/components/CouponBoxes";
import { Form, Loading, TeamMark, Empty } from "@/components/bits";

export default function MatchPage() {
  const { league: key, id } = useParams();
  const { data: lg, error } = useLeague(key);
  if (error) return <Empty title="This game isn't in our data">It may have been rescheduled. <Link className="underline" to="/fixtures">Back to fixtures</Link></Empty>;
  if (!lg) return <Loading what="the preview" />;

  const upcoming = lg.upcoming.find((m) => m.id === id);
  const played = lg.results.find((r) => r[0] === id);
  const m: Match | undefined = upcoming ?? (played ? { id: played[0], kickoff: played[1], home: played[2], away: played[3], hs: played[4], as: played[5], season: played[6], round: played[7], status: "FT", venue: null } : undefined);
  if (!m) return <Empty title="This game isn't in our data">It may have been rescheduled. <Link className="underline" to="/fixtures">Back to fixtures</Link></Empty>;

  const form = (team: string) => lg.results.filter((r) => r[2] === team || r[3] === team).slice(-5)
    .map((r) => { const f = r[2] === team ? r[4] - r[5] : r[5] - r[4]; return f > 0 ? "W" : f < 0 ? "L" : "D"; });
  const pos = (team: string) => { const i = lg.table.findIndex((t) => t.team === team); return i >= 0 ? i + 1 : null; };
  const h2h = lg.results.filter((r) => (r[2] === m.home && r[3] === m.away) || (r[2] === m.away && r[3] === m.home)).slice(-6).reverse();
  const recent = (team: string) => lg.results.filter((r) => r[2] === team || r[3] === team).slice(-5).reverse();

  return (
    <>
      <Link to={`/fixtures?league=${lg.key}`} className="inline-flex items-center gap-1 text-sm muted hover:text-ink"><ArrowLeft size={14} /> {lg.name} fixtures</Link>

      <header className="mt-6 panel overflow-hidden p-6 md:p-8">
        <div className="text-sm muted">{lg.name}{m.round ? `, round ${m.round}` : ""}</div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamSide name={m.home} he={m.winner?.he[0]} pos={pos(m.home)} form={form(m.home)} />
          <div className="text-center">
            {m.status === "FT" ? <div className="display num text-4xl font-extrabold">{m.hs}–{m.as}</div> : (
              <><div className="display num text-2xl font-bold">{time(m.kickoff)}</div><div className="text-sm muted">{dayLabel(m.kickoff)}</div></>
            )}
            {m.venue && <div className="mt-1 text-xs text-ink-faint">{m.venue}</div>}
          </div>
          <TeamSide name={m.away} he={m.winner?.he[1]} pos={pos(m.away)} form={form(m.away)} right />
        </div>
        {m.model && (
          <div className="mt-8">
            {isFootballModel(m.model) && <HeroBoxes m={m} p={m.winner?.p ?? [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]]} sels={["1", "X", "2"]} market="1X2" lg={lg} />}
            {isBasketModel(m.model) && <HeroBoxes m={m} p={m.winner?.p ?? [m.model.win["1"], m.model.win["2"]]} sels={["1", "2"]} market="Moneyline" lg={lg} />}
            <InPlainWords m={m} />
          </div>
        )}
      </header>

      {m.winner && <WinnerBoard m={m} lg={lg} />}
      {m.model && isFootballModel(m.model) && <FootballMarkets m={m} lg={lg} />}
      {m.model && isBasketModel(m.model) && (
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="panel p-5"><div className="text-xs muted">Win chance</div><div className="mt-1 num font-semibold">{m.home} {pct(m.model.win["1"])}</div><div className="num font-semibold">{m.away} {pct(m.model.win["2"])}</div></div>
          <div className="panel p-5"><div className="text-xs muted">Projected margin</div><div className="mt-1 display num text-2xl font-bold">{m.model.spread > 0 ? m.home : m.away} by {Math.abs(m.model.spread).toFixed(1)}</div><div className="text-xs text-ink-faint">How many points we expect them to win by. Fair handicap line {m.model.spread > 0 ? "−" : "+"}{Math.abs(m.model.spread).toFixed(1)} for {m.home}</div></div>
          <div className="panel p-5"><div className="text-xs muted">Projected total points</div><div className="mt-1 display num text-2xl font-bold">{m.model.total ? m.model.total.toFixed(0) : "–"}</div><div className="text-xs text-ink-faint">Both teams' points added together, projected from their last 15 games</div></div>
        </section>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <ResultsList title={`${m.home}, last five`} rows={recent(m.home)} />
        <ResultsList title={`${m.away}, last five`} rows={recent(m.away)} />
        <ResultsList title="Head to head" rows={h2h} empty="No meetings in our data." />
      </section>
    </>
  );
}

function TeamSide({ name, he, pos, form, right }: { name: string; he?: string; pos: number | null; form: string[]; right?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${right ? "items-end text-right" : ""}`}>
      <TeamMark name={name} size={44} />
      <div className="display text-lg font-bold md:text-2xl">{name}</div>
      {he && <div dir="rtl" lang="he" className={`-mt-1.5 text-sm text-ink-muted ${right ? "text-right" : "text-left"}`}>{he}</div>}
      <div className="text-xs muted">{pos ? `${pos}${["th", "st", "nd", "rd"][pos % 10 > 3 || [11, 12, 13].includes(pos % 100) ? 0 : pos % 10]} in the table` : ""}</div>
      {form.length > 0 && <Form form={form} />}
    </div>
  );
}

function ResultsList({ title, rows, empty = "No games yet." }: { title: string; rows: League["results"]; empty?: string }) {
  return (
    <div className="panel p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm muted">{empty}</p> : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r[0]} className="flex items-center justify-between gap-2">
              <span className="truncate"><span className="text-ink-faint num">{r[1].slice(5, 10).replace("-", "/")}</span> {r[2]} v {r[3]}</span>
              <span className="num font-semibold">{r[4]}–{r[5]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FootballMarkets({ m, lg }: { m: Match; lg: League }) {
  const model = m.model as Extract<Match["model"], { "1x2": unknown }>;
  const rows: { market: string; line?: number; sel: string; label: string; p: number; hint?: string }[] = [
    { market: "Double chance", sel: "1X", label: `${m.home} or draw`, p: model.dc["1X"], hint: `Double chance 1X: wins unless ${m.away} wins` },
    { market: "Double chance", sel: "12", label: "Either team wins", p: model.dc["12"], hint: "Double chance 12: wins unless it's a draw" },
    { market: "Double chance", sel: "X2", label: `${m.away} or draw`, p: model.dc.X2, hint: `Double chance X2: wins unless ${m.home} wins` },
    ...["1.5", "2.5", "3.5"].flatMap((l) => [
      { market: "Over/Under", line: Number(l), sel: "Over", label: `Over ${l} goals`, p: model.ou[l], hint: `${Math.ceil(Number(l))} or more goals in total` },
      { market: "Over/Under", line: Number(l), sel: "Under", label: `Under ${l} goals`, p: 1 - model.ou[l], hint: `${Math.floor(Number(l))} or fewer goals in total` },
    ]),
    { market: "BTTS", sel: "Yes", label: "Both teams score", p: model.btts, hint: "Each side scores at least once" },
    { market: "BTTS", sel: "No", label: "Not both teams score", p: 1 - model.btts, hint: "At least one side fails to score" },
  ];
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="panel">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Every market, priced</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">Other bets on this game. The % is our chance it wins; the bold number is the fair odds. Winner paying more than the fair odds is good value.</p>
        </div>
        <div className="divide-y divide-line">
          {rows.map((r) => <MarketRow key={r.label} m={m} lg={lg} {...r} />)}
        </div>
      </div>
      <div className="space-y-6">
        <div className="panel p-5">
          <h3 className="font-semibold">Handicap, Winner style</h3>
          <p className="mt-1 text-xs leading-relaxed muted">
            The game replayed with a head start. With {m.home} −1, they need to win by 2 or more for a 1; winning by exactly 1 counts as X. With +1, they start a goal up, so a 1-goal defeat counts as X.
          </p>
          {(["-1", "+1"] as const).map((h) => (
            <div key={h} className="mt-4">
              <div className="mb-2 text-sm">{m.home} {h}</div>
              <CouponBoxes p={[model.hcap[h]["1"], model.hcap[h].X, model.hcap[h]["2"]]} size="sm" />
            </div>
          ))}
        </div>
        <div className="panel p-5">
          <h3 className="font-semibold">Most likely scores</h3>
          <p className="mt-1 text-xs muted">Even the likeliest exact score happens only about one game in eight or nine.</p>
          <ul className="mt-3 space-y-2 num text-sm">
            {model.cs.map((c) => (
              <li key={c.score} className="flex items-center gap-3">
                <span className="w-10 font-bold">{c.score}</span>
                <span className="h-2.5 rounded-sm bg-accent" style={{ width: `${c.p * 400}%`, maxWidth: "60%" }} />
                <span className="muted">{pct(c.p, 1)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-faint num">Expected goals (the average we expect each side to score): {model.xg[0].toFixed(2)} for {m.home}, {model.xg[1].toFixed(2)} for {m.away}.</p>
        </div>
      </div>
    </section>
  );
}

function MarketRow({ m, lg, market, line, sel, label, p, hint }: { m: Match; lg: League; market: string; line?: number; sel: string; label: string; p: number; hint?: string }) {
  const { addLeg, hasLeg, removeLeg } = useApp();
  const key = `${m.id}|${market}${line ?? ""}|${sel}`;
  const on = hasLeg(key);
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 text-sm">
      <span className="min-w-0">
        <span className="block">{label}</span>
        {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      </span>
      <span className="num muted">{pct(p)}</span>
      <span className="num w-12 text-right font-semibold" title="Fair odds">{fair(p)}</span>
      <button
        className={`chip ${on ? "chip-on" : ""}`}
        aria-pressed={on}
        onClick={() => on ? removeLeg(key) : addLeg({ key, matchId: m.id, league: lg.key, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market, selection: sel, label, modelP: p, odds: null })}
      >
        {on ? <Check size={12} /> : <Plus size={12} />} Ticket
      </button>
    </div>
  );
}

function HeroBoxes({ m, p, sels, market, lg }: { m: Match; p: number[]; sels: string[]; market: string; lg: League }) {
  const { addLeg, legs, removeLeg } = useApp();
  const mine = legs.find((l) => l.matchId === m.id && l.market === market);
  return (
    <CouponBoxes
      p={p}
      size="lg"
      odds={m.winner?.odds}
      edges={m.winner?.edge}
      labels={sels.map((s) => (s === "1" ? `1 ${m.home}` : s === "2" ? `2 ${m.away}` : "X Draw"))}
      selected={mine ? sels.indexOf(mine.selection) : null}
      onPick={(i) => {
        const key = `${m.id}|${market}|${sels[i]}`;
        if (mine?.key === key) return removeLeg(key);
        addLeg({ key, matchId: m.id, league: lg.key, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market, selection: sels[i],
          label: sels[i] === "1" ? m.home : sels[i] === "2" ? m.away : "Draw", modelP: p[i], odds: m.winner?.odds?.[i] ?? null });
      }}
    />
  );
}

// One or two sentences that say what the boxes mean for this game, for readers new to odds.
function InPlainWords({ m }: { m: Match }) {
  if (!m.model) return null;
  const w = m.winner;
  const names = isFootballModel(m.model) ? [`${m.home} to win`, "a draw", `${m.away} to win`] : [`${m.home} to win`, `${m.away} to win`];
  const p = w?.p ?? (isFootballModel(m.model) ? [m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]] : isBasketModel(m.model) ? [m.model.win["1"], m.model.win["2"]] : []);
  if (!p.length) return null;
  const i = p.indexOf(Math.max(...p));
  const odds = w?.odds?.[i];
  const best = w?.best;
  return (
    <div className="mt-5 space-y-1.5 rounded border border-line bg-well px-4 py-3 text-sm leading-relaxed">
      <p>
        <span className="font-semibold">In plain words: </span>
        we make it {pct(p[i])} for {names[i]}, so the fair price is {fair(p[i])}.{" "}
        {odds
          ? odds >= 1 / p[i] * (1 + VALUE_EDGE)
            ? <>Winner pays <b>{odds.toFixed(2)}</b>, more than it should: <span className="font-semibold text-won">that's value</span>.</>
            : <>Winner pays <b>{odds.toFixed(2)}</b>, {odds < 1 / p[i] ? "less than that, so it's not value" : "about the fair price, so there's no real edge"}.</>
          : <>If Winner offers more than {fair(p[i])}, it's a good-value bet; if less, it isn't.</>}
      </p>
      {best && best.edge >= VALUE_EDGE && (best.market !== (isFootballModel(m.model) ? "1X2" : "Winner") || best.sel !== ["1", "X", "2"][i]) && (
        <p>
          <span className="font-semibold text-won">Best value on this game: </span>
          {best.label}{best.market === "1X2" || best.market === "Winner" ? " to win" : ""} at {best.odds.toFixed(2)}. We make it {pct(best.p)}; Winner's price implies {pct(1 / best.odds)}.
        </p>
      )}
    </div>
  );
}

// Every Winner market on this game: Winner's odds next to our chance and fair price.
function WinnerBoard({ m, lg }: { m: Match; lg: League }) {
  const w = m.winner!;
  const { addLeg, hasLeg, removeLeg } = useApp();
  const title = (x: WinnerMarket) => x.market === "1X2" ? "Result (1X2)" : x.market === "Winner" ? "Winner (incl. overtime)"
    : x.market === "Handicap" ? `Handicap ${x.line! > 0 ? "+" : ""}${x.line} for ${m.home}` : x.market === "Goals" ? `Total goals, ${x.line}` : `Total points, ${x.line}`;
  return (
    <section className="mt-8 panel overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">Winner's odds vs our price</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            The odds on Winner right now, next to our chance and the fair price. Green means Winner pays more than the fair price, by {pct(VALUE_EDGE)} or more.
            Winner keeps a margin of about {pct(w.margin)} on this game, which is why most prices aren't value.
          </p>
        </div>
        <span className="text-xs text-ink-faint">Winner odds updated {ago(w.fetchedAt)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-ink-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-2.5 text-left font-semibold">Bet</th>
              <th className="px-3 py-2.5 text-right font-semibold">Winner pays</th>
              <th className="px-3 py-2.5 text-right font-semibold">Our chance</th>
              <th className="px-3 py-2.5 text-right font-semibold">Fair price</th>
              <th className="px-3 py-2.5 text-right font-semibold">Value</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          {w.markets.map((x) => (
            <tbody key={x.market + x.line} className="border-b border-line last:border-0">
              <tr><td colSpan={6} className="bg-paper/60 px-5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title(x)}</td></tr>
              {x.sels.map((sel, i) => {
                const key = `${m.id}|W${x.market}${x.line ?? ""}|${sel}`;
                const on = hasLeg(key);
                const value = x.edge[i] >= VALUE_EDGE;
                return (
                  <tr key={sel} className={value ? "bg-won/5" : ""}>
                    <td className="px-5 py-2.5">{x.labels[i]}</td>
                    <td className="num px-3 py-2.5 text-right font-semibold">{x.odds[i].toFixed(2)}</td>
                    <td className="num px-3 py-2.5 text-right text-ink-muted">{pct(x.p[i])}</td>
                    <td className="num px-3 py-2.5 text-right text-ink-muted">{fair(x.p[i])}</td>
                    <td className={`num px-3 py-2.5 text-right ${value ? "font-bold text-won" : "text-ink-faint"}`}>{signedPct(x.edge[i])}</td>
                    <td className="px-5 py-2 text-right">
                      <button className={`chip ${on ? "chip-on" : ""}`} aria-pressed={on}
                        onClick={() => on ? removeLeg(key) : addLeg({ key, matchId: m.id, league: lg.key, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market: x.market, selection: sel, label: x.labels[i], modelP: x.p[i], odds: x.odds[i] })}>
                        {on ? <Check size={12} /> : <Plus size={12} />} Ticket
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
