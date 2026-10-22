// Each competition's colour and short code, for its badge, page and tiles.
export const LEAGUE_STYLE: Record<string, { color: string; code: string; deep: string }> = {
  "il-premier": { color: "#0E6B43", deep: "#09402A", code: "LW" },
  epl: { color: "#3D195B", deep: "#25103A", code: "PL" },
  laliga: { color: "#E2231A", deep: "#8E1510", code: "LL" },
  seriea: { color: "#024494", deep: "#012A5C", code: "SA" },
  bundesliga: { color: "#D20515", deep: "#7E030D", code: "BL" },
  ligue1: { color: "#0B1D3A", deep: "#050F20", code: "L1" },
  eredivisie: { color: "#F05A22", deep: "#9A3410", code: "ED" },
  primeira: { color: "#0A2A5C", deep: "#061A3A", code: "PT" },
  championship: { color: "#1D2D5C", deep: "#111B38", code: "CH" },
  ucl: { color: "#0B1E5B", deep: "#060F33", code: "CL" },
  uel: { color: "#F28C00", deep: "#8F5300", code: "EL" },
  uecl: { color: "#13A34B", deep: "#0A5E2B", code: "EC" },
  "il-basket": { color: "#F26B1D", deep: "#94400F", code: "IB" },
  euroleague: { color: "#F36D21", deep: "#1A1A1A", code: "EL" },
  nba: { color: "#1D428A", deep: "#0F2552", code: "NBA" },
};
export const leagueStyle = (k?: string) => LEAGUE_STYLE[k ?? ""] ?? { color: "#0D1B14", deep: "#050B08", code: "··" };
