import { Link } from "react-router-dom";
import { useRecord } from "@/lib/data";
import { useApp } from "@/lib/state";
import { unlockedIds } from "@/lib/access";
import { FREE_PICKS_PER_WEEK } from "@/lib/config";
import { PickCard } from "@/components/PickCard";
import { Loading, Section, TextLink } from "@/components/bits";

export default function Picks() {
  const { data } = useRecord();
  const { tier } = useApp();
  if (!data) return <Loading what="picks" />;

  const open = unlockedIds(data.picks, tier);
  const pending = data.picks.filter((p) => p.result === "pending").sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const settled = data.picks.filter((p) => p.result !== "pending").slice(0, 6);
  const lockedCount = pending.filter((p) => !open.has(p.id)).length;

  return (
    <>
      <h1 className="h1">This week's picks</h1>
      <p className="mt-3 max-w-2xl muted">
        Every pick is locked with its Winner odds before kickoff and graded automatically after the final whistle.
        {tier === "visitor" && ` Join free to open ${FREE_PICKS_PER_WEEK} Pro picks a week.`}
        {tier === "free" && ` Your free membership opens ${FREE_PICKS_PER_WEEK} Pro picks a week.`}
      </p>

      {lockedCount > 0 && tier !== "pro" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-accent/40 bg-accent-soft px-5 py-4">
          <p className="text-sm"><span className="font-semibold">{lockedCount} Pro pick{lockedCount === 1 ? "" : "s"}</span> on this card {lockedCount === 1 ? "is" : "are"} locked for you.</p>
          <Link to="/membership" className="btn-primary">{tier === "visitor" ? "Join free" : "Go Pro"}</Link>
        </div>
      )}

      <div className="mt-8">
        {pending.length === 0 ? (
          <div className="panel px-6 py-10">
            <p className="h3">No picks on the card right now</p>
            <p className="mt-2 max-w-lg text-sm muted">
              The next card goes up before the weekend's games. Meanwhile, every fixture already has our model's prices on the{" "}
              <Link to="/fixtures" className="underline underline-offset-2">fixtures page</Link>.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((p) => <PickCard key={p.id} pick={p} locked={!open.has(p.id)} />)}
          </div>
        )}
      </div>

      {settled.length > 0 && (
        <Section title="Latest results" action={<TextLink to="/record">Full record</TextLink>}>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {settled.map((p) => <PickCard key={p.id} pick={p} locked={false} />)}
          </div>
        </Section>
      )}
    </>
  );
}
