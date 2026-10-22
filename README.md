# Line Up (working name)

Winner picks, previews and model odds in English for bettors in Israel, with every pick on a public record.

React + Vite + TypeScript + Tailwind. All league data comes from free sources and refreshes itself every three hours through GitHub Actions; the site is static and can be hosted anywhere for free.

## Run it

```bash
npm install
npm run dev          # http://localhost:8080
npm run data         # fetch fresh data and rebuild the model locally (optional; Actions does this)
npm run build        # production build in dist/
```

## What's on the site

| Page | What it does |
| --- | --- |
| Home | Headline pick, next Ligat Winner games, the week's board across every league, model check scores |
| Picks | Official picks; Pro picks locked by plan (visitor, free member, Pro) |
| Fixtures | Every upcoming game with the model's 1/X/2 (or win) probabilities and fair odds |
| Match preview | Every market priced: double chance, over/under 1.5/2.5/3.5, both teams to score, Winner-style three-way handicaps, likely scores, form, head to head |
| Value finder | Type Winner's odds; it flags where Winner pays more than the fair price |
| Ticket | Builds a ticket from any selections: combined odds, payout, chance all legs win; printable |
| Leagues | Table, fixtures, results, power ratings and the model check for each league |
| Record | The full ledger: profit in units, ROI, win rate, average odds, closing-line check, splits by league and market |
| Membership | Plans, free sign-up, and a preview switch for the owner |

## Data sources (all free)

| Competitions | Source | Notes |
| --- | --- | --- |
| Premier League, Championship, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Primeira Liga | [openfootball/football.json](https://github.com/openfootball/football.json) | Public domain. Runs a week or two behind, so the newest results are filled from TheSportsDB |
| Ligat Winner, Israeli basketball, EuroLeague, Champions League, Europa League, Conference League | [TheSportsDB](https://www.thesportsdb.com) free API | About 30 requests a minute; settled rounds are cached so each run only fetches open rounds |
| NBA | NBA public schedule (`cdn.nba.com`) | Whole season in one file |

The fetcher is `scripts/fetch-data.mjs`, the leagues are listed in `scripts/leagues.mjs`, and the model is `scripts/build-model.mjs`. The workflow is `.github/workflows/data.yml`; run it by hand from the Actions tab (tick "full" to re-fetch everything). A TheSportsDB Patreon key, if you get one, goes in the `TSDB_KEY` repository secret.

Adding a league: add a line to `scripts/leagues.mjs` with its TheSportsDB id (look it up at thesportsdb.com) or openfootball file name.

## The model

- **Football leagues:** Poisson goals model with attack and defence strengths per team, home advantage, recent games weighted more (180-day half-life), the Dixon-Coles low-score correction, and shrinkage to the league average for new teams. Every market is derived from the score grid.
- **UEFA cups:** one Elo rating across all leagues, converted into expected goals.
- **Basketball:** Elo with margin of victory, 25% regression between seasons, projected margin and total.
- **Model check:** walk-forward test on past games (refit weekly, only past data), scored with Brier score and log loss against a baseline of league home/draw/away rates. Shown per league.

## Adding official picks

Picks live in `content/picks.json`. Add a pick **before kickoff**, with Winner's odds at that moment, and push. The Action grades it automatically after the game for these markets: `1X2`, `Double chance`, `Handicap`, `Over/Under`, `BTTS`, `Moneyline`. For anything else, set `result` yourself.

```json
{
  "id": "2026-10-24-mta-hbs",
  "lockedAt": "2026-10-24T09:30:00Z",
  "league": "il-premier",
  "matchId": "tsdb-1234567",
  "event": "Maccabi Tel Aviv v Hapoel Beer Sheva",
  "kickoff": "2026-10-24T17:30:00Z",
  "market": "1X2",
  "selection": "1",
  "odds": 2.15,
  "units": 1,
  "confidence": 2,
  "tier": "pro",
  "tipster": "Line Up model",
  "analysis": "Two or three sentences on why.",
  "result": "pending"
}
```

- `league` is a key from `scripts/leagues.mjs`; `matchId` is the game's id from `public/data/leagues/<league>.json` (it's also in the match page URL). Without a `matchId` the pick must be graded by hand.
- `market` / `selection`: `1X2` → `1`, `X`, `2`; `Double chance` → `1X`, `12`, `X2`; `Handicap` → `1`, `X`, `2` plus `"line": -1`; `Over/Under` → `Over` or `Under` plus `"line": 2.5`; `BTTS` → `Yes` or `No`; `Moneyline` (basketball) → `1` or `2`.
- `tier`: `free` picks are open to everyone; `pro` picks are locked except for free members' weekly allowance.
- Add `"closingOdds"` after kickoff if you record Winner's final price; the record then shows how often you beat it.
- Never edit or delete a pick after `lockedAt`. That's the whole point of the record.

## Going live: still to do

1. **Legal opinion** from an Israeli gaming lawyer on the plan (selling analysis, advertising, payments, use of Winner's name). See the business map doc.
2. **Hosting:** connect the repo to Netlify, Vercel or Cloudflare Pages (all free). Build command `npm run build`, output `dist`, and add an SPA fallback so deep links work (`/* /index.html 200`). The Action commits fresh data, which triggers a redeploy.
3. **Accounts and payments:** membership is front-end only today (the plan is stored in the browser). Add a backend for sign-up and paywalled picks (for example Supabase) and a payment provider that will process a sports-analysis subscription in Israel.
4. **Winner odds feed:** there is no free feed. Picks carry the odds you type in; the value finder takes the reader's odds.
5. **Sharp-market odds (optional):** The Odds API has a free tier (500 requests a month) and could add a "market price" next to the model price.
6. **Brand:** "Line Up" is a placeholder. Change `BRAND` in `src/lib/config.ts` and the title in `index.html`.
7. **Help resources:** confirm the best Israeli gambling-help service and add it to `src/pages/Responsible.tsx`.
