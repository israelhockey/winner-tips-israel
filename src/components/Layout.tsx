import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Ticket } from "lucide-react";
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

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${BRAND} home`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect x="2" y="12" width="12" height="8" rx="3" fill="#E9EEF6" />
        <rect x="15.5" y="12" width="5" height="8" rx="2" fill="#7F8DA6" />
        <rect x="22" y="12" width="8" height="8" rx="3" fill="#F5B83D" />
      </svg>
      <span className="wide text-lg font-extrabold">{BRAND}</span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { legs } = useApp();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? "text-chalk bg-ink-hover" : "text-chalk-muted hover:text-chalk"}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/ticket" className={`btn-quiet relative ${pathname === "/ticket" ? "bg-ink-hover" : ""}`} aria-label={`Ticket, ${legs.length} selections`}>
              <Ticket size={16} />
              <span className="hidden sm:inline">Ticket</span>
              {legs.length > 0 && <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1.5 text-xs font-bold text-ink">{legs.length}</span>}
            </Link>
            <button className="btn-quiet lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-ink-line px-4 py-3 lg:hidden" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `block rounded-lg px-3 py-2.5 font-semibold ${isActive ? "bg-ink-hover" : "text-chalk-muted"}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
        <RecordStrip />
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-4 pb-20 pt-8 md:px-6">{children}</main>

      <footer className="border-t border-ink-line bg-ink-sunk">
        <div className="mx-auto grid max-w-page gap-8 px-4 py-10 text-sm md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm muted">
              Sports analysis for adults 18 and over. We publish opinions and probabilities; we don't take bets.
              Winner is the only legal sports betting operator in Israel. We are not affiliated with it or with the Israel Sports Betting Board.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Site</p>
            <Link className="block muted hover:text-chalk" to="/how-it-works">How the model works</Link>
            <Link className="block muted hover:text-chalk" to="/record">The full record</Link>
            <Link className="block muted hover:text-chalk" to="/responsible-gambling">Responsible gambling</Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Data</p>
            <p className="muted">
              Fixtures and results from <a className="underline underline-offset-2 hover:text-chalk" href="https://github.com/openfootball/football.json">openfootball</a> (public domain),{" "}
              <a className="underline underline-offset-2 hover:text-chalk" href="https://www.thesportsdb.com">TheSportsDB</a> and the NBA's public schedule.
            </p>
          </div>
        </div>
        <div className="border-t border-ink-line py-4 text-center text-xs text-chalk-faint">
          18+ only. Bet with money you can afford to lose. <Link to="/responsible-gambling" className="underline underline-offset-2">Get help</Link>
        </div>
      </footer>
    </div>
  );
}
