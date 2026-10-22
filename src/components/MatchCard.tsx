import { Link } from "react-router-dom";
import { TeamMark, useTeamColor } from "./bits";
import { fair, time, pct } from "@/lib/format";
import { VALUE_EDGE } from "@/lib/config";
import { isBasketModel, isFootballModel, type Match } from "@/lib/types";
import { useApp } from "@/lib/state";

// One game as a card: the two clubs with their logos, a bar split by each result's chance in the
// clubs' colours, and the Winner odds underneath to tap onto the ticket.
export function MatchCard({ m, leagueKey, showLeague = false }: { m: Match; leagueKey: string; showLeague?: boolean }) {
  const { addLeg, legs, removeLeg } = useApp();
  const sport = m.sport ?? (isBasketModel(m.model) ? "basketball" : "football");
  const fm = isFootballModel(m.model) ? m.model : null;
  const bm = isBasketModel(m.model) ? m.model : null;
  const w = m.winner;
  const p = w?.p ?? (fm ? [fm["1x2"]["1"], fm["1x2"].X, fm["1x2"]["2"]] : bm ? [bm.win["1"], bm.win["2"]] : null);
  const sels = p?.length === 3 ? ["1", "X", "2"] : ["1", "2"];
  const market = p?.length === 3 ? "1X2" : "Moneyline";
  const mine = legs.find((l) => l.matchId === m.id && l.market === market);
  const homeC = useTeamColor(m.home, sport), awayC = useTeamColor(m.away, sport);
  const value = w?.edge?.some((e) => e >= VALUE_EDGE) || (w?.best && w.best.edge >= VALUE_EDGE);
  const fav = p ? p.indexOf(Math.max(...p)) : -1;

  const pick = (i: number) => {
    if (!p) return;
    const s = sels[i], key = `${m.id}|${market}|${s}`;
    if (mine?.key === key) return removeLeg(key);
    addLeg({ key, matchId: m.id, league: leagueKey, event: `${m.home} v ${m.away}`, kickoff: m.kickoff, market, selection: s,
      label: s === "1" ? m.home : s === "2" ? m.away : "Draw", modelP: p[i], odds: w?.odds?.[i] ?? null });
  };

  const meta = fm ? `Expected goals ${fm.xg[0].toFixed(1)}–${fm.xg[1].toFixed(1)}`
    : bm ? `${bm.spread > 0 ? m.home.split(" ").at(-1) : m.away.split(" ").at(-1)} by ${Math.abs(bm.spread).toFixed(1)}${bm.total ? ` · ${bm.total.toFixed(0)} pts` : ""}` : "";

  return (
    <article className={`group panel flex flex-col transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(13,27,20,0.45)] ${value ? "border-won/50" : ""}`}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <span className="flex min-w-0 items-center gap-2 text-xs">
          <span className="num font-display text-base font-bold leading-none">{time(m.kickoff)}</span>
          {showLeague && m.leagueName && <span className="truncate text-ink-faint">{m.leagueName}</span>}
        </span>
        {value && <span className="shrink-0 rounded-sm bg-won px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Value</span>}
      </div>

      <Link to={`/match/${leagueKey}/${m.id}`} className="block px-4 pb-3 pt-2.5">
        {[[m.home, 0], [m.away, p?.length === 3 ? 2 : 1]].map(([name, idx]) => (
          <div key={name as string} className="flex items-center gap-2.5 py-1">
            <TeamMark name={name as string} sport={sport} size={26} />
            <span className={`min-w-0 flex-1 truncate font-semibold group-hover:underline underline-offset-2 ${fav === idx ? "" : "text-ink/85"}`}>{name}</span>
            {p && <span className={`num font-display text-lg font-bold leading-none ${fav === idx ? "" : "text-ink-muted"}`}>{Math.round(p[idx as number] * 100)}<span className="text-[0.6em]">%</span></span>}
          </div>
        ))}
        {p && (
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-well" aria-label={sels.map((s, i) => `${s} ${pct(p[i])}`).join(", ")}>
            <span style={{ width: `${p[0] * 100}%`, background: homeC }} />
            {p.length === 3 && <span className="border-x-2 border-card bg-draw/45" style={{ width: `${p[1] * 100}%` }} />}
            <span style={{ width: `${p[p.length - 1] * 100}%`, background: awayC }} />
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-faint">
          <span className="num truncate">{meta}</span>
          {w && <span dir="rtl" lang="he" className="truncate">{w.he[0]} – {w.he[1]}</span>}
        </div>
      </Link>

      {p && (
        <div className={`mt-auto grid gap-px border-t border-line bg-line ${p.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {p.map((x, i) => {
            const on = mine?.selection === sels[i];
            const o = w?.odds?.[i] ?? null;
            const isValue = (w?.edge?.[i] ?? -1) >= VALUE_EDGE;
            return (
              <button key={i} type="button" onClick={() => pick(i)} aria-pressed={on}
                aria-label={`${sels[i] === "1" ? m.home : sels[i] === "2" ? m.away : "Draw"}: ${o ? `Winner pays ${o.toFixed(2)}` : `fair odds ${fair(x)}`}${isValue ? ", value" : ""}`}
                className={`relative flex items-center justify-between gap-1 px-3 py-2.5 text-left transition-colors first:rounded-bl-card last:rounded-br-card
                  ${on ? "bg-ink text-paper" : isValue ? "bg-won/10 hover:bg-won/20" : i === fav ? "bg-marker/70 hover:bg-marker" : "bg-card hover:bg-hover"}`}>
                <span className={`font-display text-sm font-extrabold ${on ? "text-marker" : ""}`}>{sels[i]}</span>
                <span className="text-right leading-none">
                  <span className={`num block text-[15px] font-bold ${isValue && !on ? "text-won" : ""}`}>{o ? o.toFixed(2) : fair(x)}</span>
                  <span className={`block text-[9px] font-semibold uppercase tracking-wide ${on ? "text-paper/60" : "text-ink-faint"}`}>{o ? "Winner" : "Fair"}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
