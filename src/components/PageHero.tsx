import type { ReactNode } from "react";

// A full-width page header band: a colour, big display title, a few stats, and an optional strip
// of controls along its bottom edge. Faint diagonal stripes echo the Matchday split.
export function PageHero({ eyebrow, title, intro, color = "#0D1B14", deep, stats, badge, children }: {
  eyebrow?: ReactNode; title: ReactNode; intro?: ReactNode; color?: string; deep?: string;
  stats?: [ReactNode, string][]; badge?: ReactNode; children?: ReactNode;
}) {
  return (
    <section className="bleed relative -mt-12 overflow-hidden text-white" style={{ background: `linear-gradient(120deg, ${color} 0%, ${color} 55%, ${deep ?? color} 100%)` }}>
      <span className="stage-grain pointer-events-none absolute inset-0" />
      <span className="pointer-events-none absolute -right-24 top-0 h-full w-[55%] skew-x-[-14deg] bg-white/[0.06]" />
      <span className="pointer-events-none absolute right-[18%] top-0 h-full w-24 skew-x-[-14deg] bg-black/10" />
      <div className="relative mx-auto max-w-page px-4 pb-8 pt-10 md:px-6 md:pt-14">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            {eyebrow && <p className="font-display text-lg font-bold text-marker">{eyebrow}</p>}
            <h1 className="mt-1 font-display text-[2.8rem] font-extrabold leading-[0.92] sm:text-6xl lg:text-7xl">{title}</h1>
            {intro && <p className="mt-4 max-w-2xl text-white/75">{intro}</p>}
          </div>
          {badge && <div className="hidden shrink-0 md:block">{badge}</div>}
        </div>
        {stats && stats.length > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
            {stats.map(([n, l]) => (
              <div key={l}>
                <dd className="num font-display text-4xl font-extrabold leading-none">{n}</dd>
                <dt className="mt-1 text-xs text-white/60">{l}</dt>
              </div>
            ))}
          </dl>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
