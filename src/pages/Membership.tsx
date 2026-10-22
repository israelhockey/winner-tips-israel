import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { FREE_PICKS_PER_WEEK, PRICES } from "@/lib/config";
import { useApp, type Tier } from "@/lib/state";

const PLANS: { tier: Tier; name: string; price: string; points: string[] }[] = [
  { tier: "visitor", name: "Visitor", price: "Free, no sign-up", points: ["Pick of the Day", "Model odds on every fixture", "The full public record"] },
  { tier: "free", name: "Free member", price: "Free with your email", points: [`${FREE_PICKS_PER_WEEK} Pro picks a week`, "Value finder and ticket builder", "Weekly results recap"] },
  { tier: "pro", name: "Pro", price: `₪${PRICES.monthly} a month or ₪${PRICES.season} a season`, points: ["Every pick, every day", "Instant alerts when a pick drops", "Full previews and member chat"] },
];

export default function Membership() {
  const { tier, email, joinFree, setTier } = useApp();
  const [value, setValue] = useState("");
  const [age, setAge] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); if (value.includes("@") && age) joinFree(value.trim()); };

  return (
    <>
      <h1 className="h1">Membership</h1>
      <p className="mt-3 max-w-2xl muted">Start free. Go Pro when the record has earned it: it's public, so you can check before you pay.</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.tier} className={`panel flex flex-col p-6 ${p.tier === "pro" ? "border-accent/60" : ""}`}>
            <h2 className="display text-xl font-bold">{p.name}</h2>
            <p className="mt-1 text-sm muted">{p.price}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              {p.points.map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent" />{x}</li>)}
            </ul>
            {tier === p.tier && <p className="mt-5 text-sm font-semibold text-accent">Your plan</p>}
            {p.tier === "pro" && tier !== "pro" && <p className="mt-5 text-sm muted">Pro payments open at launch.</p>}
          </div>
        ))}
      </div>

      {tier === "visitor" && (
        <form onSubmit={submit} className="mt-10 panel max-w-xl p-6">
          <h2 className="h3">Join free</h2>
          <label className="mt-4 block text-sm">
            <span className="muted">Email</span>
            <input type="email" required value={value} onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-well px-3 py-2 outline-none focus:border-accent" />
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-1 accent-accent" required />
            <span>I'm 18 or older, and I understand these are opinions, not guaranteed results.</span>
          </label>
          <button className="btn-primary mt-5" disabled={!age}>Join free</button>
        </form>
      )}
      {tier !== "visitor" && email && <p className="mt-8 text-sm muted">Signed up as {email}.</p>}

      <details className="mt-12 max-w-xl text-sm">
        <summary className="cursor-pointer muted">Preview the site as each plan</summary>
        <p className="mt-2 text-xs text-ink-faint">For the site owner, until real accounts and payments are connected.</p>
        <div className="mt-3 flex gap-2">
          {(["visitor", "free", "pro"] as Tier[]).map((t) => (
            <button key={t} className={`chip ${tier === t ? "chip-on" : ""}`} onClick={() => setTier(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </details>
    </>
  );
}
