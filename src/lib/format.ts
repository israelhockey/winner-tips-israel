import { TZ } from "./config";

const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export const dayKey = (iso: string) => keyFmt.format(new Date(iso));
export const time = (iso: string) => timeFmt.format(new Date(iso));

export function dayLabel(iso: string) {
  const k = dayKey(iso);
  const today = dayKey(new Date().toISOString());
  const tomorrow = dayKey(new Date(Date.now() + 86400e3).toISOString());
  if (k === today) return "Today";
  if (k === tomorrow) return "Tomorrow";
  return dayFmt.format(new Date(iso));
}

export const shortDate = (iso: string) => dayFmt.format(new Date(iso));

export function ago(iso: string) {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

// Fair odds are the decimal odds with no bookmaker margin: 1 / probability.
export const fair = (p: number) => (p > 0 ? (1 / p).toFixed(2) : "–");
export const pct = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`;
export const units = (u: number) => `${u > 0 ? "+" : ""}${u.toFixed(2)}u`;
export const signedPct = (x: number) => `${x > 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

// Value of a price against our probability: positive means the odds pay more than they should.
export const edge = (p: number, odds: number) => p * odds - 1;
