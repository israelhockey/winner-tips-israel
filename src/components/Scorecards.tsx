import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useTracks, type Track } from "@/lib/data";
import { pct, units, shortDate } from "@/lib/format";
import type { RecordSummary } from "@/lib/types";

// The site scored several ways at once: the sealed picks, and the automatic tracks that log a
// call on every game before kickoff.
export function Scorecards({ sealed }: { sealed: RecordSummary }) {
  const { data } = useTracks();
  const [open, setOpen] = useState<string>("favourite");
  if (!data) return null;
  const current = data.tracks.find((t) => t.key === open);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="h2">Scorecards</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            The model logs a call on every game before kickoff, scored several ways. Calls freeze at kickoff and are graded from the final score.
            {data.since && ` Tracking since ${shortDate(data.since)}.`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <a href="#every-pick" className="group relative overflow-hidden rounded-card bg-ink p-4 text-white">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4ADE80]"><ShieldCheck size={14} /> Sealed value picks</div>
          <Big n={sealed.graded ? `${sealed.won}/${sealed.graded}` : "–"} sub={sealed.graded ? `${units(sealed.units)} · ${pct(sealed.roi, 1)} return` : `${sealed.pending} waiting for kickoff`} />
          <Form last={sealed.last10} dark />
        </a>
        {data.tracks.map((t) => (
          <button key={t.key} onClick={() => setOpen(t.key)} aria-pressed={open === t.key}
            className={`rounded-card border p-4 text-left transition-all hover:-translate-y-0.5 ${open === t.key ? "border-ink bg-card shadow-lg" : "border-line bg-card/70 hover:border-ink-faint"}`}>
            <div className="text-xs font-semibold text-ink-muted">{t.name}</div>
            <Big n={t.summary.hitRate === null ? "–" : pct(t.summary.hitRate)} sub={t.summary.graded ? `${t.summary.won}/${t.summary.graded} right${t.summary.staked ? ` · ${units(t.summary.units)}` : ""}` : `${t.summary.pending} calls waiting`} />
            <Form last={t.summary.last10} />
          </button>
        ))}
      </div>

      {current && <TrackDetail t={current} />}
    </section>
  );
}

function Big({ n, sub }: { n: string; sub: string }) {
  return (
    <div className="mt-2">
      <div className="num font-display text-3xl font-extrabold leading-none sm:text-4xl">{n}</div>
      <div className="mt-1 text-xs opacity-70">{sub}</div>
    </div>
  );
}

function Form({ last, dark }: { last: ("W" | "L")[]; dark?: boolean }) {
  if (!last.length) return <div className="mt-3 h-2" />;
  return (
    <div className="mt-3 flex gap-1">
      {last.map((r, i) => <span key={i} className={`h-2 flex-1 rounded-full ${r === "W" ? "bg-won" : dark ? "bg-white/25" : "bg-lost/50"}`} />)}
    </div>
  );
}

function TrackDetail({ t }: { t: Track }) {
  const s = t.summary;
  return (
    <div className="mt-4 panel overflow-hidden">
      <div className="grid gap-4 border-b border-line p-5 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="font-display text-2xl font-extrabold">{t.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t.desc}</p>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-xs text-ink-muted">Right</dt><dd className="num font-display text-2xl font-extrabold">{s.graded ? `${s.won}/${s.graded}` : "–"}</dd></div>
          <div><dt className="text-xs text-ink-muted">We expected</dt><dd className="num font-display text-2xl font-extrabold">{s.graded ? s.expectedHits.toFixed(1) : "–"}</dd></div>
          <div><dt className="text-xs text-ink-muted">Profit at Winner odds</dt><dd className={`num font-display text-2xl font-extrabold ${s.units > 0 ? "text-won" : s.units < 0 ? "text-lost" : ""}`}>{s.staked ? units(s.units) : "–"}</dd></div>
        </dl>
      </div>
      {s.graded > 0 && <p className="border-b border-line bg-well px-5 py-2.5 text-xs text-ink-muted">"We expected" adds up our own percentages. If the real number of right calls stays close to it, our percentages are honest.</p>}
      {t.recent.length === 0 ? (
        <p className="p-5 text-sm text-ink-muted">No calls have kicked off yet. They appear here at kickoff and get graded after the final whistle.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <tbody className="divide-y divide-line">
              {t.recent.map((r, i) => (
                <tr key={i}>
                  <td className="num px-5 py-2.5 text-xs text-ink-muted">{shortDate(r.kickoff)}</td>
                  <td className="px-3 py-2.5"><div className="font-semibold">{r.event}</div><div className="text-xs text-ink-faint">{r.league}</div></td>
                  <td className="px-3 py-2.5">{r.label}{r.winnerLabel && <div className="text-xs text-ink-faint">Winner had {r.winnerLabel}</div>}</td>
                  <td className="num px-3 py-2.5 text-right text-ink-muted">{pct(r.p)}</td>
                  <td className="num px-3 py-2.5 text-right">{r.odds ? r.odds.toFixed(2) : "–"}</td>
                  <td className={`px-5 py-2.5 text-right text-xs font-bold ${r.result === "won" ? "text-won" : r.result === "lost" ? "text-lost" : "text-ink-faint"}`}>
                    {r.result === "pending" ? "Pending" : `${r.result === "won" ? "Right" : r.result === "lost" ? "Wrong" : "Void"}${r.final ? ` · ${r.final}` : ""}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
