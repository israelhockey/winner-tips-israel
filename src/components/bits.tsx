import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { kit } from "@/lib/kits";
import { useLogos, logoSrc } from "@/lib/data";
import { leagueStyle } from "@/lib/leagueStyle";

// A club's logo; where we have none, a badge in its kit colours with its initials.
export function TeamMark({ name, size = 28, sport = "football" }: { name: string; size?: number; sport?: string }) {
  const { data: logos } = useLogos();
  const [broken, setBroken] = useState(false);
  const logo = logos?.[`${sport}|${name}`]?.[0];
  if (logo && !broken) {
    return (
      <img src={logoSrc(logo, size)} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setBroken(true)}
        className="inline-block shrink-0 object-contain" style={{ width: size, height: size }} />
    );
  }
  const words = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter((w) => w && !/^(FC|AFC|CF|BC|SC|AC)$/i.test(w));
  const text = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  const [bg, fg] = kit(name);
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-extrabold leading-none"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.4, boxShadow: bg === "#FFFFFF" ? "inset 0 0 0 1px #D2DAD3" : undefined }}
      aria-hidden
    >
      {text}
    </span>
  );
}

// A club's main colour for charts: its own where we know it, else its kit colour. Very light
// colours are swapped for ink so they show on white.
export function useTeamColor(name: string, sport = "football") {
  const { data: logos } = useLogos();
  const c = logos?.[`${sport}|${name}`]?.[1] || kit(name)[0];
  const hex = c.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.82 ? "#0D1B14" : `#${hex}`;
}

export function Form({ form }: { form: string[] }) {
  const tone: Record<string, string> = { W: "bg-won text-paper", D: "bg-draw text-paper", L: "bg-lost text-paper" };
  return (
    <span className="inline-flex gap-1" aria-label={`Last ${form.length}: ${form.join(" ")}`}>
      {form.map((r, i) => (
        <span key={i} className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold ${tone[r] ?? "bg-line"}`}>{r}</span>
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
  return <Link to={to} className="text-sm font-semibold text-accent hover:underline underline-offset-4">{children}</Link>;
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
      <div className={`display num text-2xl font-bold ${tone === "good" ? "text-won" : tone === "bad" ? "text-lost" : ""}`}>{value}</div>
      <div className="text-xs muted">{label}</div>
    </div>
  );
}

// A competition's badge: its colour with its short code.
export function LeagueBadge({ league, size = 28 }: { league?: string; size?: number }) {
  const s = leagueStyle(league);
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-md font-display font-extrabold leading-none text-white"
      style={{ width: size, height: size, background: s.color, fontSize: size * (s.code.length > 2 ? 0.34 : 0.44), boxShadow: "inset 0 -3px 0 rgba(0,0,0,.25)" }} aria-hidden>
      {s.code}
    </span>
  );
}
