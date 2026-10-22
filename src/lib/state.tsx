import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// ---------- Ticket ----------
// A leg the reader adds from any fixture. Winner odds are typed in by the reader (or come
// from an official pick), because Winner's prices aren't available from a free feed.
export interface Leg {
  key: string;
  matchId: string;
  league: string;
  event: string;
  kickoff: string;
  market: string;
  selection: string;
  label: string;
  modelP: number | null;
  odds: number | null;
}

// ---------- Membership ----------
// Front-end only for now: the tier lives in the browser. Real accounts and payments need a
// backend (see README, "Going live").
export type Tier = "visitor" | "free" | "pro";

interface Ctx {
  legs: Leg[];
  addLeg: (l: Leg) => void;
  removeLeg: (key: string) => void;
  setOdds: (key: string, odds: number | null) => void;
  clearLegs: () => void;
  hasLeg: (key: string) => boolean;
  tier: Tier;
  email: string | null;
  setTier: (t: Tier) => void;
  joinFree: (email: string) => void;
}

const AppCtx = createContext<Ctx | null>(null);

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export function AppProvider({ children }: { children: ReactNode }) {
  const [legs, setLegs] = useState<Leg[]>(() => read("lu.ticket", []));
  const [tier, setTier] = useState<Tier>(() => read("lu.tier", "visitor"));
  const [email, setEmail] = useState<string | null>(() => read("lu.email", null));

  useEffect(() => write("lu.ticket", legs), [legs]);
  useEffect(() => write("lu.tier", tier), [tier]);
  useEffect(() => write("lu.email", email), [email]);

  const value = useMemo<Ctx>(() => ({
    legs,
    // One selection per match: adding a second from the same match replaces the first.
    addLeg: (l) => setLegs((xs) => [...xs.filter((x) => x.matchId !== l.matchId), l]),
    removeLeg: (key) => setLegs((xs) => xs.filter((x) => x.key !== key)),
    setOdds: (key, odds) => setLegs((xs) => xs.map((x) => (x.key === key ? { ...x, odds } : x))),
    clearLegs: () => setLegs([]),
    hasLeg: (key) => legs.some((x) => x.key === key),
    tier, email, setTier,
    joinFree: (e) => { setEmail(e); setTier((t) => (t === "pro" ? t : "free")); },
  }), [legs, tier, email]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
