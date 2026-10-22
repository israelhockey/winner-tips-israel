import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// A quiet monogram for a club: no crests (those belong to the clubs).
export function TeamMark({ name, size = 28 }: { name: string; size?: number }) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
  const text = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full border border-ink-line bg-ink-sunk text-[10px] font-bold text-chalk-muted narrow"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {text}
    </span>
  );
}

export function Form({ form }: { form: string[] }) {
  const tone: Record<string, string> = { W: "bg-won text-ink", D: "bg-draw text-ink", L: "bg-lost text-ink" };
  return (
    <span className="inline-flex gap-1" aria-label={`Last ${form.length}: ${form.join(" ")}`}>
      {form.map((r, i) => (
        <span key={i} className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold ${tone[r] ?? "bg-ink-line"}`}>{r}</span>
      ))}
    </span>
  );
}

export function Section({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mt-12 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="h2">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="text-sm font-semibold text-amber hover:underline underline-offset-4">{children}</Link>;
}

export function Loading({ what = "data" }: { what?: string }) {
  return <div className="py-16 text-center muted">Loading {what}…</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel px-6 py-10 text-center">
      <p className="h3">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm muted">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className={`wide num text-2xl font-bold ${tone === "good" ? "text-won" : tone === "bad" ? "text-lost" : ""}`}>{value}</div>
      <div className="text-xs muted">{label}</div>
    </div>
  );
}
