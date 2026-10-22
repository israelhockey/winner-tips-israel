export type Sport = "football" | "basketball";
export type Status = "NS" | "FT" | "LIVE" | "PST";

export interface FootballModel {
  xg: [number, number];
  "1x2": { "1": number; X: number; "2": number };
  dc: { "1X": number; "12": number; X2: number };
  ou: Record<string, number>;
  btts: number;
  hcap: Record<"-1" | "+1", { "1": number; X: number; "2": number }>;
  cs: { score: string; p: number }[];
}

export interface BasketModel {
  win: { "1": number; "2": number };
  spread: number;
  total: number | null;
  sd: number;
}

export interface Match {
  id: string;
  season: string;
  round: string | null;
  kickoff: string;
  home: string;
  away: string;
  hs: number | null;
  as: number | null;
  status: Status;
  venue: string | null;
  model?: FootballModel | BasketModel | null;
  league?: string;
  leagueName?: string;
  sport?: Sport;
}

export interface LeagueSummary {
  key: string;
  name: string;
  country: string;
  sport: Sport;
  cup: boolean;
  featured: boolean;
  season: string;
  upcoming: number;
  played: number;
  nextKickoff: string | null;
  lastResultAt: string | null;
  fetchedAt: string;
  check: { matches: number; hitRate: number; brier: number; baselineBrier: number } | null;
}

export interface RecordSummary {
  picks: number;
  graded: number;
  pending: number;
  won: number;
  units: number;
  staked: number;
  roi: number;
  avgOdds: number;
  beatClosing: number | null;
  last10: ("W" | "L")[];
}

export interface Index {
  updatedAt: string;
  leagues: LeagueSummary[];
  upcoming: Match[];
  record: RecordSummary;
}

export interface TableRow {
  team: string; p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number; form: string[];
}

export interface ModelCheck {
  matches: number;
  from: string;
  hitRate: number;
  brier: number;
  baselineBrier: number;
  logLoss: number;
  calibration: { predicted: number; actual: number; n: number }[];
}

// [id, kickoff, home, away, hs, as, season, round]
export type ResultRow = [string, string, string, string, number, number, string, string | null];

export interface League {
  key: string;
  name: string;
  country: string;
  sport: Sport;
  cup: boolean;
  source: string;
  fetchedAt: string;
  season: string;
  table: TableRow[];
  ratings: { team: string; rating: number; attack?: number; defence?: number }[];
  upcoming: Match[];
  results: ResultRow[];
  check: ModelCheck | null;
}

export type PickResult = "pending" | "won" | "lost" | "void";

export interface Pick {
  id: string;
  lockedAt: string;
  league: string;
  leagueName: string;
  matchId?: string;
  event: string;
  kickoff: string;
  market: string;
  selection: string;
  line?: number;
  odds: number;
  closingOdds?: number;
  units: number;
  confidence: 1 | 2 | 3;
  tier: "free" | "pro";
  tipster: string;
  analysis: string;
  result: PickResult;
  profit: number;
  final: string | null;
}

export interface PicksRecord {
  summary: RecordSummary;
  curve: { at: string; units: number }[];
  byLeague: { key: string; picks: number; won: number; staked: number; profit: number; roi: number }[];
  byMarket: { key: string; picks: number; won: number; staked: number; profit: number; roi: number }[];
  picks: Pick[];
}

export const isFootballModel = (m: Match["model"]): m is FootballModel => !!m && "1x2" in m;
export const isBasketModel = (m: Match["model"]): m is BasketModel => !!m && "win" in m;
