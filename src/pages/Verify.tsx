import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Loading } from "@/components/bits";
import { selectionText } from "@/components/PickCard";
import { shortDate, time } from "@/lib/format";
import type { Pick } from "@/lib/types";

// Must match scripts/ledger.mjs exactly.
const LOCKED_FIELDS = ["id", "lockedAt", "matchId", "league", "event", "kickoff", "market", "line", "selection", "label", "odds", "p", "units"] as const;
const GENESIS = "0".repeat(64);

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Row = Pick & { ok: boolean; before: boolean };

// Recomputes the model picks' hash chain in the reader's browser. Nothing is taken on trust:
// the page downloads the ledger and checks every link itself.
export default function Verify() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [broken, setBroken] = useState<number>(-1);

  useEffect(() => {
    (async () => {
      const picks: Pick[] = await fetch(`${import.meta.env.BASE_URL}data/ledger.json`).then((r) => (r.ok ? r.json() : []));
      let prev = GENESIS, firstBad = -1;
      const out: Row[] = [];
      for (let i = 0; i < picks.length; i++) {
        const p = picks[i] as Pick & Record<string, unknown>;
        const h = await sha256(prev + JSON.stringify(LOCKED_FIELDS.map((k) => p[k] ?? null)));
        const ok = p.prevHash === prev && h === p.hash;
        if (!ok && firstBad < 0) firstBad = i;
        out.push({ ...p, ok, before: Date.parse(p.lockedAt) < Date.parse(p.kickoff) });
        prev = p.hash ?? "";
      }
      setBroken(firstBad);
      setRows(out.reverse());
    })().catch(() => setRows([]));
  }, []);

  const intact = rows && broken < 0;
  return (
    <>
      <PageHero eyebrow="Verify" title="Don't trust us. Check."
        intro="Every model pick is sealed with a fingerprint the moment it's made, and each fingerprint includes the one before it. Change, delete or back-date a single pick and every fingerprint after it breaks. Your browser just re-checked all of them."
        color="#0D1B14" deep="#0E5A3A" />

      {!rows ? <Loading what="the ledger" /> : (
        <>
          <div className={`mt-8 flex items-start gap-4 rounded-card border p-5 ${intact ? "border-won/40 bg-won/10" : "border-lost/40 bg-lost/10"}`}>
            {intact ? <ShieldCheck className="mt-0.5 shrink-0 text-won" size={28} /> : <ShieldAlert className="mt-0.5 shrink-0 text-lost" size={28} />}
            <div>
              <p className="font-display text-2xl font-extrabold">
                {rows.length === 0 ? "The ledger is empty so far" : intact ? `Chain intact: ${rows.length === 1 ? "the 1 pick checks" : `all ${rows.length} picks check`} out` : `Chain broken at pick ${broken + 1}`}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {rows.length === 0
                  ? "The model logs its first pick as soon as Winner's odds show a value bet. Each one appears here, sealed, before kickoff."
                  : intact
                    ? `Every pick was locked before its game started (${rows.filter((r) => r.before).length} of ${rows.length}) and none has been changed since.`
                    : "Something in the ledger doesn't match its fingerprint. That should never happen; please tell us."}
              </p>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="mt-6 panel overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-xs text-ink-muted">
                  <tr className="border-b border-line">
                    <th className="px-4 py-3 font-semibold">Pick</th>
                    <th className="px-4 py-3 font-semibold">Locked</th>
                    <th className="px-4 py-3 font-semibold">Kickoff</th>
                    <th className="px-4 py-3 text-right font-semibold">Odds</th>
                    <th className="px-4 py-3 font-semibold">Fingerprint</th>
                    <th className="px-4 py-3 text-right font-semibold">Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id} id={r.id} className="target:bg-marker/20">
                      <td className="px-4 py-3"><div className="font-semibold">{selectionText(r)}</div><div className="text-xs text-ink-faint">{r.event} · {r.id}</div></td>
                      <td className="num px-4 py-3 text-ink-muted">{shortDate(r.lockedAt)} {time(r.lockedAt)}</td>
                      <td className="num px-4 py-3 text-ink-muted">{shortDate(r.kickoff)} {time(r.kickoff)}</td>
                      <td className="num px-4 py-3 text-right font-semibold">{r.odds.toFixed(2)}</td>
                      <td className="px-4 py-3"><code className="rounded bg-well px-1.5 py-0.5 text-xs">{r.hash?.slice(0, 16)}…</code></td>
                      <td className={`px-4 py-3 text-right text-xs font-bold ${r.ok && r.before ? "text-won" : "text-lost"}`}>{r.ok ? (r.before ? "✓ Sealed before kickoff" : "Sealed late") : "✗ Doesn't match"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <section className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="h2">How the seal works</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-ink-muted">
                <li>When the model finds a value bet, it writes down the pick: the game, the bet, Winner's odds and the time.</li>
                <li>It makes a SHA-256 fingerprint of those details together with the previous pick's fingerprint.</li>
                <li>Any change to any earlier pick changes its fingerprint, and that breaks every pick after it.</li>
                <li>This page downloads the ledger and redoes every fingerprint itself, in your browser.</li>
              </ol>
            </div>
            <div>
              <h2 className="h2">Check it yourself</h2>
              <p className="mt-4 leading-relaxed text-ink-muted">
                The full ledger is public at <a className="font-semibold text-accent underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/ledger.json`}>/data/ledger.json</a>.
                Each fingerprint is <code className="rounded bg-well px-1 text-xs">sha256(previous fingerprint + JSON of [{LOCKED_FIELDS.join(", ")}])</code>, starting from 64 zeros.
                Any programmer can recompute it in a few lines. Results are graded from the final score; see the <Link className="font-semibold text-accent underline underline-offset-2" to="/record">record</Link>.
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}
