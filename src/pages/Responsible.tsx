export default function Responsible() {
  return (
    <article className="max-w-2xl">
      <h1 className="h1">Responsible gambling</h1>
      <p className="mt-4 text-lg text-chalk/85">
        Betting should cost no more than a night out. Our picks are opinions backed by a model, and even good bets lose often.
        You must be 18 or over to use this site and to bet on Winner.
      </p>

      <h2 className="h2 mt-10">Keep it in proportion</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-chalk/85">
        <li>Set a monthly amount before the month starts, and stop when it's gone.</li>
        <li>Stake the same small amount on every pick. Our units exist for exactly this.</li>
        <li>Never chase losses with bigger stakes or longer tickets.</li>
        <li>Don't bet on credit, with money meant for bills, or when you're upset or drinking.</li>
        <li>Take breaks. Weeks without a bet are normal and healthy.</li>
      </ul>

      <h2 className="h2 mt-10">Signs it's becoming a problem</h2>
      <p className="mt-4 text-chalk/85">
        Betting more than you planned, hiding it from people close to you, borrowing to bet, or feeling restless when you can't.
        If any of these sound familiar, talk to someone today.
      </p>

      <h2 className="h2 mt-10">Where to get help</h2>
      <ul className="mt-4 space-y-4">
        <li className="panel p-5">
          <p className="font-semibold">ERAN, emotional first aid</p>
          <p className="mt-1 text-sm muted">Free, anonymous support by phone and chat, around the clock. Call <a className="font-semibold text-chalk underline underline-offset-2" href="tel:1201">1201</a> or visit <a className="underline underline-offset-2" href="https://www.eran.org.il">eran.org.il</a>.</p>
        </li>
        <li className="panel p-5">
          <p className="font-semibold">Gamblers Anonymous</p>
          <p className="mt-1 text-sm muted">Peer support groups, including online meetings in English: <a className="underline underline-offset-2" href="https://www.gamblersanonymous.org">gamblersanonymous.org</a>.</p>
        </li>
        <li className="panel p-5">
          <p className="font-semibold">In an emergency</p>
          <p className="mt-1 text-sm muted">Call Magen David Adom on <a className="font-semibold text-chalk underline underline-offset-2" href="tel:101">101</a>.</p>
        </li>
      </ul>
    </article>
  );
}
