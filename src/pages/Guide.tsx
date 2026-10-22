import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// The beginner's guide: every number on the site, in plain English.
const SECTIONS: { id: string; title: string; intro?: string; items: [string, ReactNode][] }[] = [
  {
    id: "odds",
    title: "Odds, in one minute",
    items: [
      ["What odds mean", <>Winner shows odds as a single number, like <b>2.50</b>. Multiply your stake by it to get your total return if you win. 100 NIS at 2.50 returns 250 NIS: your 100 back plus 150 profit.</>],
      ["Odds are a chance in disguise", <>Divide 1 by the odds to get the chance they imply. 2.50 means 1 ÷ 2.50 = 40%. Low odds (1.30) mean a strong favourite; high odds (6.00) mean an outsider.</>],
      ["Fair odds", <>Our fair odds are the price with no bookmaker margin: exactly 1 ÷ our chance. If we give a result 40%, its fair odds are 2.50.</>],
      ["The margin", <>Winner, like every bookmaker, pays less than fair odds. Add up the chances behind its three odds on a game and you get about 110%, not 100%: that extra 10% is Winner's margin, and it's why most bets lose over time.</>],
      ["Value", <>A bet has value when Winner pays <i>more</i> than our fair odds. Fair 2.50 and Winner offers 2.80? That's value. Winner offers 2.20? Skip it. Picking only value bets is the one way to beat the margin over many bets, though any single bet can still lose.</>],
    ],
  },
  {
    id: "football",
    title: "Football bets",
    intro: "These are the markets you'll see on the coupon and on each game page.",
    items: [
      ["1 X 2", <>Who wins after 90 minutes plus stoppage time. 1 = home team, X = draw, 2 = away team. Extra time and penalties don't count.</>],
      ["Double chance", <>Two results in one bet: <b>1X</b> wins if the home team wins or draws, <b>X2</b> if the away team wins or draws, <b>12</b> if either team wins. Safer, so the odds are lower.</>],
      ["Over / Under goals", <>Bet on the total goals by both teams. <b>Over 2.5</b> wins with 3 or more goals; <b>Under 2.5</b> with 2 or fewer. The .5 means there's never a tie.</>],
      ["Both teams to score", <><b>Yes</b> wins if each team scores at least once, whatever the result. <b>No</b> wins if either team fails to score.</>],
      ["Handicap (Winner style)", <>One team starts with a goal advantage or a goal behind. <b>Home −1</b>: the home team needs to win by 2 or more for a 1. If it wins by exactly 1, the handicap result is X, a draw. Winner's handicap has three results, like a normal game.</>],
      ["Correct score", <>The exact final score. Even the most likely score usually happens only about one game in eight, so the odds are high.</>],
    ],
  },
  {
    id: "basketball",
    title: "Basketball bets",
    items: [
      ["Winner (1 2)", <>No draws in basketball: overtime is played until someone wins. So there are only two boxes, 1 and 2.</>],
      ["Margin (handicap)", <>"Sheva by 2.9" means we expect Hapoel Be'er Sheva to win by about 3 points. A handicap bet asks whether a team wins by more (or loses by less) than a given number.</>],
      ["Total points", <>Both teams' points added together. "Total 173" is our projection; Over/Under bets ask whether the real total ends up above or below a line.</>],
    ],
  },
  {
    id: "numbers",
    title: "Our numbers",
    items: [
      ["The percentage", <>How often we think a result happens. Our model looks at every team's recent goals scored and conceded, home advantage and opponent strength. Where Winner prices the game, we blend the model (35%) with Winner's own prices once the margin is taken out (65%), because those know about injuries and team news.</>],
      ["W 1.64", <>Winner's odds for that result, read from Winner's public coupon every three hours. Odds move, so always check the app before you play.</>],
      ["Expected goals", <>The average goals we expect each team to score in this game. Shown as home–away, for example 1.8–0.9.</>],
      ["Form (W D L)", <>Each team's last five results in this competition, oldest on the left: <span className="font-semibold text-won">W</span> win, <span className="font-semibold text-draw">D</span> draw, <span className="font-semibold text-lost">L</span> loss.</>],
      ["Yellow box", <>The result we think is most likely. "Most likely" is not "certain": a 45% favourite still fails more often than it succeeds.</>],
      ["“Sharper than baseline”", <>How we test the model. We replay past games, predicting each one using only what was known before kickoff, and compare against a simple guess based on each league's usual home, draw and away rates. More sharper is better.</>],
    ],
  },
  {
    id: "site",
    title: "Using the site",
    items: [
      ["Ticket", <>Tap any box or market to add it to your ticket. It's a shortlist on this device for comparing with Winner before you play. We don't take bets.</>],
      ["Value finder", <>Every bet Winner offers on our games, compared with our fair price and sorted by value. Green means Winner pays more than the bet is worth.</>],
      ["Picks", <>Our tipsters' selections, each posted before kickoff with Winner's odds at that moment.</>],
      ["The record", <>Every pick we've published, won or lost, graded automatically from the final score. Nothing is deleted, so you can judge us on all of it.</>],
    ],
  },
];

export default function Guide() {
  return (
    <>
      <p className="font-display text-lg font-bold text-accent">Beginner's guide</p>
      <h1 className="h1 mt-1">Every number on this site, in plain English</h1>
      <p className="mt-3 max-w-2xl muted">
        Never placed a bet, or new to Winner's coupon? Start here. Three minutes, no jargon left unexplained.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Sections">
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>{s.title}</a>)}
      </nav>

      <div className="mt-10 space-y-14">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="h2">{s.title}</h2>
            {s.intro && <p className="mt-2 max-w-2xl muted">{s.intro}</p>}
            <dl className="mt-5 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-2">
              {s.items.map(([t, d]) => (
                <div key={t} className="bg-card p-5">
                  <dt className="font-semibold">{t}</dt>
                  <dd className="mt-1.5 max-w-prose leading-relaxed text-ink-muted">{d}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-14 panel flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-xl muted">Betting is for adults 18 and over. Only bet money you can afford to lose, and never chase losses.</p>
        <div className="flex gap-2">
          <Link to="/fixtures" className="btn-primary">See this week's games</Link>
          <Link to="/responsible-gambling" className="btn-quiet">Staying in control</Link>
        </div>
      </div>
    </>
  );
}
