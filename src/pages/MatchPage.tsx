import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { useLeague } from "@/lib/data";
import { dayLabel, time, fair, pct } from "@/lib/format";
import { isBasketModel, isFootballModel, type League, type Match } from "@/lib/types";
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
          <TeamSide name={m.home} pos={pos(m.home)} form={form(m.home)} />
          <div className="text-center">
            {m.status === "FT" ? <div className="display num text-4xl font-extrabold">{m.hs}–{m.as}</div> : (
              <><div className="display num text-2xl font-bold">{time(m.kickoff)}</div><div className="text-sm muted">{dayLabel(m.kickoff)}</div></>
            )}
            {m.venue && <div className="mt-1 text-xs text-ink-faint">{m.venue}</div>}
          </div>
          <TeamSide name={m.away} pos={pos(m.away)} form={form(m.away)} right />
        </div>
        {m.model && (
          <div className="mt-8">
            {isFootballModel(m.model) && <HeroBoxes m={m} p={[m.model["1x2"]["1"], m.model["1x2"].X, m.model["1x2"]["2"]]} sels={["1", "X", "2"]} market="1X2" lg={lg} />}
            {isBasketModel(m.model) && <HeroBoxes m={m} p={[m.model.win["1"], m.model.win["2"]]} sels={["1", "2"]} market="Moneyline" lg={lg} />}
          </div>
        )}
      </header>

      {m.model && isFootballModel(m.model) && <FootballMarkets m={m} lg={lg} />}
      {m.model && isBasketModel(m.model) && (
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="panel p-5"><div className="text-xs muted">Win chance</div><div className="mt-1 num font-semibold">{m.home} {pct(m.model.win["1"])}</div><div className="num font-semibold">{m.away} {pct(m.model.win["2"])}</div></div>
          <div className="panel p-5"><div className="text-xs muted">Projected margin</div><div className="mt-1 display num text-2xl font-bold">{m.model.spread > 0 ? m.home : m.away} by {Math.abs(m.model.spread).toFixed(1)}</div><div className="text-xs text-ink-faint">Fair handicap line {m.model.spread > 0 ? "-" : "+"}{Math.abs(m.model.spread).toFixed(1)} for {m.home}</div></div>
          <div className="panel p-5"><div className="text-xs muted">Projected total points</div><div className="mt-1 display num text-2xl font-bold">{m.model.total ? m.model.total.toFixed(0) : "–"}</div><div className="text-xs text-ink-faint">From each team's last 15 games</div></div>
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

function TeamSide({ name, pos, form, right }: { name: string; pos: number | null; form: string[]; right?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${right ? "items-end text-right" : ""}`}>
      <TeamMark name={name} size={44} />
      <div className="display text-lg font-bold md:text-2xl">{name}</div>
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
  const rows: { market: string; line?: number; sel: string; label: string; p: number }[] = [
    { market: "Double chance", sel: "1X", label: `${m.home} or draw`, p: model.dc["1X"] },
    { market: "Double chance", sel: "12", label: "Either team wins", p: model.dc["12"] },
    { market: "Double chance", sel: "X2", label: `${m.away} or draw`, p: model.dc.X2 },
    ...["1.5", "2.5", "3.5"].flatMap((l) => [
      { market: "Over/Under", line: Number(l), sel: "Over", label: `Over ${l} goals`, p: model.ou[l] },
      { market: "Over/Under", line: Number(l), sel: "Under", label: `Under ${l} goals`, p: 1 - model.ou[l] },
    ]),
    { market: "BTTS", sel: "Yes", label: "Both teams score", p: model.btts },
    { market: "BTTS", sel: "No", label: "Not both teams score", p: 1 - model.btts },
  ];
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="panel">
        <h2 className="border-b border-line px-5 py-4 font-semibold">Every market, priced</h2>
        <div className="divide-y divide-line">
          {rows.map((r) => <MarketRow key={r.label} m={m} lg={lg} {...r} />)}
        </div>
      </div>
      <div className="space-y-6">
        <div className="panel p-5">
          <h3 className="font-semibold">Handicap, Winner style</h3>
          <p className="mt-1 text-xs muted">Three-way: the handicap is applied to the home side, and the draw is a result of its own.</p>
          {(["-1", "+1"] as const).map((h) => (
            <div key={h} className="mt-4">
              <div className="mb-2 text-sm">{m.home} {h}</div>
              <CouponBoxes p={[model.hcap[h]["1"], model.hcap[h].X, model.hcap[h]["2"]]} size="sm" />
            </div>
          ))}
        </div>
        <div className="panel p-5">
          <h3 className="font-semibold">Most likely scores</h3>
          <ul className="mt-3 space-y-2 num text-sm">
            {model.cs.map((c) => (
              <li key={c.score} className="flex items-center gap-3">
                <span className="w-10 font-bold">{c.score}</span>
                <span className="h-2.5 rounded-sm bg-accent" style={{ width: `${c.p * 400}%`, maxWidth: "60%" }} />
                <span className="muted">{pct(c.p, 1)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-faint num">Expected goals {model.xg[0].toFixed(2)} for {m.home}, {model.xg[1].toFixed(2)} for {m.away}.</p>
        </div>
      </div>
    </section>
  );
}

function MarketRow({ m, lg, market, line, sel, label, p }: { m: Match; lg: League; market: string; line?: number; sel: string; label: string; p: number }) {
  const { addLeg, hasLeg, removeLeg } = useApp();
  const key = `${m.id}|${market}${line ?? ""}|${sel}`;
  const on = hasLeg(key);
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 text-sm">
      <span>{label}</span>
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
      labels={sels.map((s) => (s === "1" ? `1 ${m.home}` : s === "2" ? `2 ${m.away}` : "X Draw"))}
      selected={mine ? sels.indexOf(mine.selection) : null}
      onPick={(i) => {
        const key = `${m.id}|${market}|${sels[i]}`;
        if (mine?.key === key) return removeLeg(key);
        addLeg({ key, matchId: m.id, league: lg.key, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market, selection: sels[i],
          label: sels[i] === "1" ? m.home : sels[i] === "2" ? m.away : "Draw", modelP: p[i], odds: null });
      }}
    />
  );
}
