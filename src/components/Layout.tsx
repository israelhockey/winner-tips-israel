import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { BRAND } from "@/lib/config";
import { useApp } from "@/lib/state";
import { RecordStrip } from "./RecordStrip";

const NAV = [
  { to: "/picks", label: "Picks" },
  { to: "/fixtures", label: "Fixtures" },
  { to: "/value", label: "Value finder" },
  { to: "/leagues", label: "Leagues" },
  { to: "/record", label: "Record" },
  { to: "/membership", label: "Membership" },
];

// The mark: three coupon boxes, the first one marked.
export function Mark({ size = 30, onDark = false }: { size?: number; onDark?: boolean }) {
  const stroke = onDark ? "#FFFFFF" : "#0D1B14";
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 50 30" aria-hidden>
      <rect x="1" y="5" width="14" height="20" rx="2" fill="#FFE14D" stroke={stroke} strokeWidth="2" />
      <rect x="18" y="5" width="14" height="20" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
      <rect x="35" y="5" width="14" height="20" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
      <path d="M4 15 L7.5 19 L12.5 10" fill="none" stroke="#0D1B14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${BRAND} home`}>
      <Mark onDark={onDark} />
      <span className={`font-display text-[1.7rem] font-extrabold leading-none ${onDark ? "text-white" : ""}`}>{BRAND}</span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { legs } = useApp();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <RecordStrip />
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `relative py-2 text-sm font-semibold transition-colors ${isActive ? "text-ink after:absolute after:inset-x-0 after:-bottom-[13px] after:h-[3px] after:bg-accent" : "text-ink-muted hover:text-ink"}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/ticket" className="btn bg-ink text-paper hover:bg-accent-deep" aria-label={`Your ticket, ${legs.length} selections`}>
              Ticket
              <span className={`num grid h-5 min-w-5 place-items-center rounded px-1 text-xs font-bold ${legs.length ? "bg-marker text-ink" : "bg-white/15"}`}>{legs.length}</span>
            </Link>
            <button className="btn-quiet px-3 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-line bg-paper px-4 py-2 lg:hidden" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `block border-b border-line py-3 font-display text-xl font-bold last:border-0 ${isActive ? "text-accent" : ""}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-4 pb-24 pt-12 md:px-6">{children}</main>

      <footer className="pitch-bg text-white/80">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-14 text-sm md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
          <div>
            <Logo onDark />
            <p className="mt-4 max-w-sm leading-relaxed">
              Sports analysis for adults 18 and over. We publish opinions and probabilities; we don't take bets.
              Winner is the only legal sports betting operator in Israel. We aren't affiliated with it or with the Israel Sports Betting Board.
            </p>
          </div>
          <div className="space-y-2.5">
            <p className="font-display text-lg font-bold text-white">Site</p>
            <Link className="block hover:text-white" to="/how-it-works">How the model works</Link>
            <Link className="block hover:text-white" to="/record">The full record</Link>
            <Link className="block hover:text-white" to="/responsible-gambling">Responsible gambling</Link>
          </div>
          <div className="space-y-2.5">
            <p className="font-display text-lg font-bold text-white">Data</p>
            <p className="leading-relaxed">
              Fixtures and results from <a className="underline underline-offset-2 hover:text-white" href="https://github.com/openfootball/football.json">openfootball</a> (public domain),{" "}
              <a className="underline underline-offset-2 hover:text-white" href="https://www.thesportsdb.com">TheSportsDB</a> and ESPN's public scoreboards.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
          18+ only. Bet with money you can afford to lose. <Link to="/responsible-gambling" className="underline underline-offset-2 hover:text-white">Get help</Link>
        </div>
      </footer>
    </div>
  );
}
