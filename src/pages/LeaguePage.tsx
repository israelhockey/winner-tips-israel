import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLeague } from "@/lib/data";
import { ago, pct, shortDate } from "@/lib/format";
import { Form, Loading, Empty, TeamMark } from "@/components/bits";
import { Board } from "@/components/Board";
import { HowToRead } from "@/components/HowToRead";
import type { League } from "@/lib/types";

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
      <div className="text-sm muted"><Link to="/leagues" className="hover:text-ink">Leagues</Link> / {lg.country}</div>
      <h1 className="h1 mt-2">{lg.name}</h1>
      <p className="mt-2 text-sm text-ink-faint">Season {lg.season.replace("-20", "/").replace("-", "/")}. Data updated {ago(lg.fetchedAt)}.</p>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={current === t} onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${current === t ? "border-accent text-ink" : "border-transparent muted hover:text-ink"}`}>
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
    <>
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm num">
        <thead className="text-xs muted">
          <tr className="border-b border-line text-right">
            <th className="w-10 px-3 py-3 text-left font-semibold">#</th><th className="px-3 py-3 text-left font-semibold">Team</th>
            <th className="px-3 py-3 font-semibold">P</th><th className="px-3 py-3 font-semibold">W</th>{fb && <th className="px-3 py-3 font-semibold">D</th>}
            <th className="px-3 py-3 font-semibold">L</th><th className="px-3 py-3 font-semibold">{fb ? "GD" : "+/-"}</th>
            <th className="px-3 py-3 font-semibold">Pts</th><th className="px-3 py-3 text-left font-semibold">Form</th>
          </tr>
        </thead>
        <tbody>
          {lg.table.map((r, i) => (
            <tr key={r.team} className="border-b border-line text-right last:border-0">
              <td className="px-3 py-2.5 text-left muted">{i + 1}</td>
              <td className="px-3 py-2.5 text-left"><span className="flex items-center gap-2 font-semibold"><TeamMark name={r.team} size={22} sport={lg.sport} />{r.team}</span></td>
              <td className="px-3 py-2.5">{r.p}</td><td className="px-3 py-2.5">{r.w}</td>{fb && <td className="px-3 py-2.5">{r.d}</td>}
              <td className="px-3 py-2.5">{r.l}</td><td className="px-3 py-2.5">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="px-3 py-2.5 font-bold">{r.pts}</td>
              <td className="px-3 py-2.5 text-left"><Form form={r.form} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-ink-faint">
      P played · W won{fb ? " · D drawn" : ""} · L lost · {fb ? "GD goal difference (scored minus conceded)" : "+/- points scored minus conceded"} · Pts {fb ? "points (3 for a win, 1 for a draw)" : "points"} · Form: last five games, oldest first
    </p>
    </>
  );
}

function FixturesView({ lg }: { lg: League }) {
  const matches = useMemo(() => lg.upcoming.map((m) => ({ ...m, league: lg.key, leagueName: lg.name, sport: lg.sport })), [lg]);
  if (!matches.length) return <p className="panel p-6 muted">No games scheduled in the next three weeks.</p>;
  return (
    <div className="space-y-6">
      <HowToRead />
      <Board matches={matches} leagueFilter={false} />
    </div>
  );
}

function ResultsView({ lg }: { lg: League }) {
  const rows = lg.results.filter((r) => r[6] === lg.season).slice().reverse();
  if (!rows.length) return <p className="panel p-6 muted">No results yet this season.</p>;
  return (
    <div className="panel divide-y divide-line">
      {rows.map((r) => (
        <Link to={`/match/${lg.key}/${r[0]}`} key={r[0]} className="grid grid-cols-[5.5rem_1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm hover:bg-hover">
          <span className="num text-xs muted">{shortDate(r[1])}</span>
          <span className={`truncate text-right ${r[4] > r[5] ? "font-bold" : ""}`}>{r[2]}</span>
          <span className="num rounded bg-well px-2 py-0.5 font-bold">{r[4]}–{r[5]}</span>
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
          ? "Our ranking of how strong each team really is, whatever the table says. Attack 1.30 means the team scores 30% more than an average side; defence 0.80 means it concedes 20% less (lower is better). Recent games count more."
          : "Our ranking of how strong each team really is, whatever the table says. A team rated 100 points higher would win about 64% of games on a neutral floor."}
      </p>
      <div className="panel divide-y divide-line">
        {lg.ratings.map((r, i) => (
          <div key={r.team} className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 px-4 py-2.5 text-sm md:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
            <span className="num muted">{i + 1}</span>
            <span className="truncate font-semibold">{r.team}</span>
            <span className="h-2 rounded-full bg-ink-faint" style={{ width: `${8 + ((r.rating - min) / (max - min || 1)) * 92}%` }} />
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
          Can you trust our percentages? To check, we replayed {c.matches} {lg.name} games from {shortDate(c.from)}, predicting each one using only what was known before kickoff, then compared with what actually happened.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div><dt className="text-xs muted">Our favourite won</dt><dd className="display num text-2xl font-bold">{pct(c.hitRate)}</dd></div>
          <div><dt className="text-xs muted">Brier score</dt><dd className="display num text-2xl font-bold text-won">{c.brier.toFixed(3)}</dd></div>
          <div><dt className="text-xs muted">Baseline Brier</dt><dd className="display num text-2xl font-bold muted">{c.baselineBrier.toFixed(3)}</dd></div>
          <div><dt className="text-xs muted">Log loss</dt><dd className="display num text-2xl font-bold">{c.logLoss.toFixed(3)}</dd></div>
        </dl>
        <p className="mt-6 text-sm muted">
          The Brier score measures how far our percentages were from what happened: 0 would be perfect, and lower is better. The baseline is a simple guess that only knows how often home wins, draws and away wins happen in this league. Beating it means the model adds real information.
          This is a test of the model's probabilities, not a betting record: that's on the <Link to="/record" className="underline underline-offset-2">record page</Link>.
        </p>
      </div>
      <div className="panel p-5">
        <h3 className="font-semibold">When we said X%, it happened…</h3>
        <svg viewBox={`0 0 ${W} ${W}`} className="mt-3 w-full" role="img" aria-label="Calibration: predicted probability against how often it happened">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(1)} stroke="#D2DAD3" />
              <line x1={X(0)} x2={X(1)} y1={Y(t)} y2={Y(t)} stroke="#D2DAD3" />
              <text x={X(t)} y={W - 10} fontSize="10" fill="#8A988F" textAnchor="middle">{t * 100}%</text>
              <text x={8} y={Y(t) + 3} fontSize="10" fill="#8A988F">{t * 100}%</text>
            </g>
          ))}
          <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="#55665C" strokeDasharray="3 4" />
          {c.calibration.map((b) => <circle key={b.predicted} cx={X(b.predicted)} cy={Y(b.actual)} r={3 + Math.sqrt(b.n) / 3} fill="#0E6B43" fillOpacity="0.85" />)}
        </svg>
        <p className="mt-2 text-xs text-ink-faint">Dots on the dashed line mean the probabilities are honest. Bigger dots hold more predictions.</p>
      </div>
    </div>
  );
}
