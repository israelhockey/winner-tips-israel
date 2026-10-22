import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const KEY = "lu.howto.closed";
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const save = (v: boolean) => { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* storage unavailable */ } };

// A plain-English key for the coupon boxes, shown above every list of games.
// Open on first visit; remembers if the reader folds it away.
export function HowToRead({ className = "" }: { className?: string }) {
  const [closed, setClosed] = useState(read);
  const toggle = () => { setClosed(!closed); save(!closed); };

  return (
    <div className={`panel overflow-hidden ${className}`}>
      <button onClick={toggle} aria-expanded={!closed}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-hover">
        <span className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded bg-marker font-display text-base font-extrabold">?</span>
          <span className="font-semibold">New to this? How to read a game</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${closed ? "" : "rotate-180"}`} />
      </button>

      {!closed && (
        <div className="grid gap-8 border-t border-line px-5 py-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
          {/* A labelled example card */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Example</div>
            <div className="mt-3 overflow-hidden rounded-card border border-line bg-card">
              <div className="px-4 pb-3 pt-3">
                {[["Maccabi", "#F2C500", 61, true], ["Hapoel", "#D2432B", 16, false]].map(([n, c, v, f]) => (
                  <div key={n as string} className="flex items-center gap-2.5 py-1">
                    <span className="h-6 w-6 rounded-full" style={{ background: c as string }} />
                    <span className={`flex-1 font-semibold ${f ? "" : "text-ink/85"}`}>{n}</span>
                    <span className={`num font-display text-lg font-bold ${f ? "" : "text-ink-muted"}`}>{v}<span className="text-[0.6em]">%</span></span>
                  </div>
                ))}
                <div className="mt-2.5 flex h-2 overflow-hidden rounded-full">
                  <span style={{ width: "61%", background: "#F2C500" }} /><span className="border-x-2 border-card bg-draw/45" style={{ width: "23%" }} /><span style={{ width: "16%", background: "#D2432B" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
                {[["1", "1.55", "bg-marker/70"], ["X", "3.90", "bg-card"], ["2", "6.80", "bg-won/10"]].map(([k, o, bg]) => (
                  <div key={k} className={`flex items-center justify-between px-3 py-2.5 ${bg}`}>
                    <span className="font-display text-sm font-extrabold">{k}</span>
                    <span className="text-right leading-none"><span className={`num block text-[15px] font-bold ${k === "2" ? "text-won" : ""}`}>{o}</span><span className="block text-[9px] font-semibold uppercase tracking-wide text-ink-faint">Winner</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <Item term="1 · X · 2">The three possible results, as on the Winner coupon. 1 is a home win, X is a draw, 2 is an away win.</Item>
            <Item term="The coloured bar">Each result's chance, in the clubs' colours, with the draw in grey. The longer a club's side, the likelier it wins.</Item>
            <Item term="61%">How likely we think that club wins. 61% means: play this game 100 times and Maccabi wins about 61.</Item>
            <Item term="1.55 Winner">What Winner pays right now for that result. Where Winner hasn't priced a game yet, you'll see our fair odds instead, marked "Fair".</Item>
            <Item term={<span className="font-bold text-won">Green</span>}>Value: Winner pays more than the result is worth, by 5% or more. That's the kind of bet that wins over time.</Item>
            <Item term={<span className="marked">Yellow</span>}>The result we think is most likely. Most likely doesn't mean certain: favourites lose often.</Item>
            <Item term="Expected goals">How many goals we expect each team to score, on average. 2.0–1.6 points to an open game; 0.9–0.8 to a tight one.</Item>
            <Item term="The Hebrew line">The teams exactly as Winner writes them, so you can find the game in the Winner app.</Item>
            <Item term="Tap a price">Adds that result to your ticket, a shortlist with Winner's odds you can take to the app.</Item>
          </dl>

          <p className="text-sm text-ink-muted lg:col-span-2">
            Want the full glossary? <Link to="/guide" className="font-semibold text-accent underline underline-offset-2">Read the beginner's guide</Link>. It takes three minutes.
          </p>
        </div>
      )}
    </div>
  );
}

function Item({ term, children }: { term: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{term}</dt>
      <dd className="mt-0.5 leading-relaxed text-ink-muted">{children}</dd>
    </div>
  );
}
