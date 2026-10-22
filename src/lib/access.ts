import { FREE_PICKS_PER_WEEK, TZ } from "./config";
import type { Tier } from "./state";
import type { Pick } from "./types";

// Which pending picks a reader can open. Settled picks are always public: that's the record.
//   visitor: free picks only
//   free member: free picks, plus the first FREE_PICKS_PER_WEEK Pro picks of the week
//   pro: everything
export function unlockedIds(picks: Pick[], tier: Tier): Set<string> {
  const open = new Set<string>();
  const wk = weekStart();
  let allowance = tier === "free" ? FREE_PICKS_PER_WEEK : 0;
  const sorted = [...picks].sort((a, b) => a.lockedAt.localeCompare(b.lockedAt));
  for (const p of sorted) {
    if (p.result !== "pending" || p.tier === "free" || tier === "pro") { open.add(p.id); continue; }
    if (allowance > 0 && Date.parse(p.lockedAt) >= wk) { open.add(p.id); allowance--; }
  }
  return open;
}

// Sunday 00:00 in Israel, as a timestamp.
function weekStart() {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const offset = now.getTime() - local.getTime();
  local.setHours(0, 0, 0, 0);
  local.setDate(local.getDate() - local.getDay());
  return local.getTime() + offset;
}
