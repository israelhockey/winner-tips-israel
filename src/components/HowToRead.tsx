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
        <div className="grid gap-8 border-t border-line px-5 py-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* A labelled example box */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Example: Maccabi v Hapoel</div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <ExampleBox label="1" odds="1.55" p={61} fav />
              <ExampleBox label="X" odds="3.90" p={23} />
              <ExampleBox label="2" odds="5.40" p={16} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-xs text-ink-muted">
              <span>Home team wins</span><span>Draw</span><span>Away team wins</span>
            </div>
          </div>

          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <Item term="1 · X · 2">The three possible results, the same as on the Winner coupon. 1 is a home win, X is a draw, 2 is an away win.</Item>
            <Item term="The big number (61%)">How likely we think that result is. 61% means: play this game 100 times and the home team wins about 61.</Item>
            <Item term="W 1.64, the small number">What Winner pays right now. Where Winner hasn't priced a game yet, you'll see our fair odds instead, without the W.</Item>
            <Item term={<span className="rounded-sm bg-won px-1 text-white">Value</span>}>Winner pays more than the result is worth, by 5% or more. That's the kind of bet that wins over time.</Item>
            <Item term={<span className="marked">Yellow box</span>}>The result our model thinks is most likely. Most likely doesn't mean certain: favourites lose often.</Item>
            <Item term="Expected goals">How many goals we expect each team to score, on average. 2.0–1.6 points to an open game; 0.9–0.8 to a tight one.</Item>
            <Item term="The Hebrew line">The teams exactly as Winner writes them, so you can find the game in the Winner app.</Item>
            <Item term="Tap a box">Adds that result to your ticket, a shortlist with Winner's odds you can take to the app.</Item>
          </dl>

          <p className="text-sm text-ink-muted lg:col-span-2">
            Want the full glossary? <Link to="/guide" className="font-semibold text-accent underline underline-offset-2">Read the beginner's guide</Link>. It takes three minutes.
          </p>
        </div>
      )}
    </div>
  );
}

function ExampleBox({ label, odds, p, fav }: { label: string; odds: string; p: number; fav?: boolean }) {
  return (
    <div className={`flex h-16 flex-col justify-between rounded border px-2.5 py-1.5 ${fav ? "border-marker-deep bg-marker" : "border-line bg-card"}`}>
      <span className="flex items-baseline justify-between">
        <span className="font-display text-sm font-extrabold">{label}</span>
        <span className="num text-[11px] font-semibold"><span className="mr-0.5 text-[9px] font-bold text-ink-faint">W</span>{odds}</span>
      </span>
      <span className="num font-display text-xl font-bold leading-none">{p}<span className="text-[0.55em]">%</span></span>
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
