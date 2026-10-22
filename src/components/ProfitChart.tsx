// Running profit in units, one point per settled pick. Hand-drawn SVG, no chart library.
export function ProfitChart({ points }: { points: { at: string; units: number }[] }) {
  const W = 720, H = 220, P = { l: 44, r: 12, t: 12, b: 26 };
  const ys = [0, ...points.map((p) => p.units)];
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max(1, (hi - lo) * 0.1);
  const y0 = lo - pad, y1 = hi + pad;
  const X = (i: number) => P.l + (i / Math.max(points.length, 1)) * (W - P.l - P.r);
  const Y = (v: number) => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = [`M${X(0)} ${Y(0)}`, ...points.map((p, i) => `L${X(i + 1)} ${Y(p.units)}`)].join(" ");
  const ticks = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  const last = points.at(-1)?.units ?? 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Running profit, now ${last.toFixed(2)} units after ${points.length} settled picks`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="#24324D" />
          <text x={P.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="#5D6B84" className="num">{t.toFixed(1)}</text>
        </g>
      ))}
      <line x1={P.l} x2={W - P.r} y1={Y(0)} y2={Y(0)} stroke="#8B98AE" strokeDasharray="3 4" />
      <path d={path} fill="none" stroke={last >= 0 ? "#46C38A" : "#E8705F"} strokeWidth="2.25" strokeLinejoin="round" />
      <text x={P.l} y={H - 6} fontSize="11" fill="#5D6B84">{points[0]?.at}</text>
      <text x={W - P.r} y={H - 6} fontSize="11" fill="#5D6B84" textAnchor="end">{points.at(-1)?.at}</text>
    </svg>
  );
}
