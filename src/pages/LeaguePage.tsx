import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLeague } from "@/lib/data";
import { ago, pct, shortDate, dayKey, dayLabel } from "@/lib/format";
import { Form, Loading, Empty, TeamMark } from "@/components/bits";
import { FixtureRow } from "@/components/FixtureRow";
import type { League, Match } from "@/lib/types";

const TABS = ["Table", "Fixtures", "Results", "Ratings", "Model check"] as const;
type Tab = (typeof TABS)[number];

export default function LeaguePage() {
  const { key } = useParams();
  const { data: lg, error } = useLeague(key);
  const [tab, setTab] = useState<Tab>("Table");
  if (error) return <Empty title="We don't cover that league yet"><Link className="underline" to="/leagues">See all leagues</Link></Empty>;
  if (!lg) return <Loading what="the league" />;
  const tabs = TABS.filter((t) => (t === "Table" ? lg.table.length > 0 : t === "Model check" ? !!lg.check : true));
  const current = tabs.includes(tab) ? tab : tabs[0];

  return (
    <>
      <div className="text-sm muted"><Link to="/leagues" className="hover:text-chalk">Leagues</Link> / {lg.country}</div>
      <h1 className="h1 mt-2">{lg.name}</h1>
      <p className="mt-2 text-sm text-chalk-faint">Season {lg.season.replace("-20", "/").replace("-", "/")}. Data updated {ago(lg.fetchedAt)}.</p>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-ink-line" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={current === t} onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${current === t ? "border-amber text-chalk" : "border-transparent muted hover:text-chalk"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {current === "Table" && <TableView lg={lg} />}
        {current === "Fixtures" && <FixturesView lg={lg} />}
        {current === "Results" && <ResultsView lg={lg} />}
        {current === "Ratings" && <RatingsView lg={lg} />}
        {current === "Model check" && lg.check && <CheckView lg={lg} />}
      </div>
    </>
  );
}

function TableView({ lg }: { lg: League }) {
  const fb = lg.sport === "football";
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm num">
        <thead className="text-xs muted">
          <tr className="border-b border-ink-line text-right">
            <th className="w-10 px-3 py-3 text-left font-semibold">#</th><th className="px-3 py-3 text-left font-semibold">Team</th>
            <th className="px-3 py-3 font-semibold">P</th><th className="px-3 py-3 font-semibold">W</th>{fb && <th className="px-3 py-3 font-semibold">D</th>}
            <th className="px-3 py-3 font-semibold">L</th><th className="px-3 py-3 font-semibold">{fb ? "GD" : "+/-"}</th>
            <th className="px-3 py-3 font-semibold">Pts</th><th className="px-3 py-3 text-left font-semibold">Form</th>
          </tr>
        </thead>
        <tbody>
          {lg.table.map((r, i) => (
            <tr key={r.team} className="border-b border-ink-line text-right last:border-0">
              <td className="px-3 py-2.5 text-left muted">{i + 1}</td>
              <td className="px-3 py-2.5 text-left"><span className="flex items-center gap-2 font-semibold"><TeamMark name={r.team} size={22} />{r.team}</span></td>
              <td className="px-3 py-2.5">{r.p}</td><td className="px-3 py-2.5">{r.w}</td>{fb && <td className="px-3 py-2.5">{r.d}</td>}
              <td className="px-3 py-2.5">{r.l}</td><td className="px-3 py-2.5">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="px-3 py-2.5 font-bold">{r.pts}</td>
              <td className="px-3 py-2.5 text-left"><Form form={r.form} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FixturesView({ lg }: { lg: League }) {
  const groups = useMemo(() => {
    const g = new Map<string, Match[]>();
    for (const m of lg.upcoming) { const k = dayKey(m.kickoff); g.set(k, [...(g.get(k) ?? []), m]); }
    return [...g.values()];
  }, [lg]);
  if (!groups.length) return <p className="panel p-6 muted">No games scheduled in the next three weeks.</p>;
  return (
    <div className="space-y-6">
      {groups.map((ms) => (
        <section key={ms[0].kickoff}>
          <h2 className="mb-2 text-sm font-semibold muted">{dayLabel(ms[0].kickoff)}</h2>
          <div className="panel">{ms.map((m) => <FixtureRow key={m.id} m={m} leagueKey={lg.key} />)}</div>
        </section>
      ))}
    </div>
  );
}

function ResultsView({ lg }: { lg: League }) {
  const rows = lg.results.filter((r) => r[6] === lg.season).slice().reverse();
  if (!rows.length) return <p className="panel p-6 muted">No results yet this season.</p>;
  return (
    <div className="panel divide-y divide-ink-line">
      {rows.map((r) => (
        <Link to={`/match/${lg.key}/${r[0]}`} key={r[0]} className="grid grid-cols-[5.5rem_1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm hover:bg-ink-hover">
          <span className="num text-xs muted">{shortDate(r[1])}</span>
          <span className={`truncate text-right ${r[4] > r[5] ? "font-bold" : ""}`}>{r[2]}</span>
          <span className="num rounded bg-ink-sunk px-2 py-0.5 font-bold">{r[4]}–{r[5]}</span>
          <span className={`truncate ${r[5] > r[4] ? "font-bold" : ""}`}>{r[3]}</span>
        </Link>
      ))}
    </div>
  );
}

function RatingsView({ lg }: { lg: League }) {
  const poisson = lg.ratings.some((r) => r.attack !== undefined);
  const max = Math.max(...lg.ratings.map((r) => r.rating));
  const min = Math.min(...lg.ratings.map((r) => r.rating));
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm muted">
        {poisson
          ? "Attack is goals scored relative to the league average (above 1 is better); defence is goals conceded (below 1 is better). Recent games count more."
          : "Elo ratings: about 100 points is worth a 64% win chance on a neutral floor. They carry across seasons and, for the cups, across leagues."}
      </p>
      <div className="panel divide-y divide-ink-line">
        {lg.ratings.map((r, i) => (
          <div key={r.team} className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 px-4 py-2.5 text-sm md:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
            <span className="num muted">{i + 1}</span>
            <span className="truncate font-semibold">{r.team}</span>
            <span className="h-2 rounded-full bg-chalk-faint" style={{ width: `${8 + ((r.rating - min) / (max - min || 1)) * 92}%` }} />
            <span className="num hidden text-xs muted md:block">
              {poisson ? `attack ${r.attack?.toFixed(2)}, defence ${r.defence?.toFixed(2)}` : r.rating}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function CheckView({ lg }: { lg: League }) {
  const c = lg.check!;
  const W = 320, P = 30;
  const X = (v: number) => P + v * (W - 2 * P), Y = (v: number) => W - P - v * (W - 2 * P);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="panel p-6">
        <p className="max-w-xl text-sm muted">
          From {shortDate(c.from)}, the model predicted {c.matches} {lg.name} games using only what it knew before each one, refitting every week.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div><dt className="text-xs muted">Favourite won</dt><dd className="wide num text-2xl font-bold">{pct(c.hitRate)}</dd></div>
          <div><dt className="text-xs muted">Brier score</dt><dd className="wide num text-2xl font-bold text-won">{c.brier.toFixed(3)}</dd></div>
          <div><dt className="text-xs muted">Baseline Brier</dt><dd className="wide num text-2xl font-bold muted">{c.baselineBrier.toFixed(3)}</dd></div>
          <div><dt className="text-xs muted">Log loss</dt><dd className="wide num text-2xl font-bold">{c.logLoss.toFixed(3)}</dd></div>
        </dl>
        <p className="mt-6 text-sm muted">
          Lower is better for both scores. The baseline knows only how often home wins, draws and away wins happen in this league.
          This is a test of the model's probabilities, not a betting record: that's on the <Link to="/record" className="underline underline-offset-2">record page</Link>.
        </p>
      </div>
      <div className="panel p-5">
        <h3 className="font-semibold">When we said X%, it happened…</h3>
        <svg viewBox={`0 0 ${W} ${W}`} className="mt-3 w-full" role="img" aria-label="Calibration: predicted probability against how often it happened">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(1)} stroke="#24324D" />
              <line x1={X(0)} x2={X(1)} y1={Y(t)} y2={Y(t)} stroke="#24324D" />
              <text x={X(t)} y={W - 10} fontSize="10" fill="#5D6B84" textAnchor="middle">{t * 100}%</text>
              <text x={8} y={Y(t) + 3} fontSize="10" fill="#5D6B84">{t * 100}%</text>
            </g>
          ))}
          <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="#8B98AE" strokeDasharray="3 4" />
          {c.calibration.map((b) => <circle key={b.predicted} cx={X(b.predicted)} cy={Y(b.actual)} r={3 + Math.sqrt(b.n) / 3} fill="#F5B83D" fillOpacity="0.85" />)}
        </svg>
        <p className="mt-2 text-xs text-chalk-faint">Dots on the dashed line mean the probabilities are honest. Bigger dots hold more predictions.</p>
      </div>
    </div>
  );
}
