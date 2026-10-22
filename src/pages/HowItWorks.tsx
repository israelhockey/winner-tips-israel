import { Link } from "react-router-dom";

export default function HowItWorks() {
  return (
    <article className="max-w-2xl">
      <h1 className="h1">How the model works</h1>
      <p className="mt-4 text-lg text-ink/85">
        Every price on this site comes from a model that turns past results into a probability for each result.
        Here's what it does, in plain terms, and how we keep it honest.
      </p>

      <h2 className="h2 mt-10">Football leagues</h2>
      <p className="mt-4 text-ink/85">
        Each team gets an attack rating (how many goals it scores against an average defence) and a defence rating
        (how many it concedes against an average attack), plus a home advantage for the league. Recent games count more:
        a game from six months ago counts half as much as one from last weekend. New and promoted teams start close to the league average
        and earn their ratings as they play.
      </p>
      <p className="mt-4 text-ink/85">
        From those ratings we expect a number of goals for each side, and from that a chance for every score. Add the scores up and you get
        every market Winner offers: 1X2, double chance, over and under, both teams to score, and the three-way handicaps.
      </p>

      <h2 className="h2 mt-10">The European cups</h2>
      <p className="mt-4 text-ink/85">
        When clubs from different leagues meet, we use one Elo rating built from every domestic and European game we track,
        so a Ligat Winner side and a Bundesliga side are measured on the same scale.
      </p>

      <h2 className="h2 mt-10">Basketball</h2>
      <p className="mt-4 text-ink/85">
        Each team has an Elo rating that moves after every game, by more for a bigger win. From the gap between two teams we get a win chance and a
        projected margin, and from each team's recent scoring a projected total.
      </p>

      <h2 className="h2 mt-10">Fair odds and value</h2>
      <p className="mt-4 text-ink/85">
        The fair odds are one divided by our probability, with no bookmaker margin. When Winner offers more than the fair odds, the bet has value.
        Value doesn't mean it will win; it means that over hundreds of bets like it, the price is in your favour.
      </p>

      <h2 className="h2 mt-10">Keeping it honest</h2>
      <p className="mt-4 text-ink/85">
        We test the model on past seasons using only what it knew before each game, and publish the scores on each league's
        Model check tab. Official picks are a separate thing: a tipster's call, locked with Winner's odds before kickoff and graded on the{" "}
        <Link to="/record" className="underline underline-offset-2">public record</Link>.
      </p>

      <h2 className="h2 mt-10">Where the data comes from</h2>
      <p className="mt-4 text-ink/85">
        Fixtures and results for the big European leagues come from{" "}
        <a className="underline underline-offset-2" href="https://github.com/openfootball/football.json">openfootball</a>, a public-domain project.
        Ligat Winner, Israeli basketball and EuroLeague come from <a className="underline underline-offset-2" href="https://www.thesportsdb.com">TheSportsDB</a>,
        and the European cups and NBA from ESPN's public scoreboards. Everything refreshes every three hours.
      </p>
    </article>
  );
}
