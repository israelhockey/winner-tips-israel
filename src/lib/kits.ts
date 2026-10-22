// Club kit colours for the small badges next to team names. Colours only, never crests.
// Matched by name; anything not listed gets a stable colour pair from its name.
const KITS: [RegExp, string, string][] = [
  // Israel
  [/maccabi tel.?aviv/i, "#FFD200", "#0033A0"],
  [/maccabi haifa/i, "#00843D", "#FFFFFF"],
  [/maccabi netanya/i, "#FFD200", "#111111"],
  [/maccabi petah|maccabi petach/i, "#1D4FA3", "#FFFFFF"],
  [/maccabi bnei reineh|bnei reineh/i, "#1E6FD9", "#FFFFFF"],
  [/beitar/i, "#FFD200", "#111111"],
  [/hapoel be'?er sheva|hapoel beer sheva/i, "#D2232A", "#FFFFFF"],
  [/hapoel jerusalem/i, "#D2232A", "#111111"],
  [/hapoel/i, "#D2232A", "#FFFFFF"],
  [/bnei sakhnin/i, "#C8102E", "#FFFFFF"],
  [/bnei yehuda/i, "#F47A20", "#111111"],
  [/ironi kiryat shmona|kiryat shmona/i, "#2A74C7", "#FFFFFF"],
  [/ironi tiberias|tiberias/i, "#1B5FAA", "#FFFFFF"],
  [/ashdod/i, "#E30613", "#FFD200"],
  [/maccabi/i, "#FFD200", "#0033A0"],
  // England
  [/arsenal/i, "#DB0007", "#FFFFFF"], [/chelsea/i, "#034694", "#FFFFFF"], [/liverpool/i, "#C8102E", "#F6EB61"],
  [/manchester city|man city/i, "#6CABDD", "#1C2C5B"], [/manchester united|man united/i, "#DA291C", "#FBE122"],
  [/tottenham/i, "#FFFFFF", "#132257"], [/newcastle/i, "#111111", "#FFFFFF"], [/aston villa/i, "#670E36", "#95BFE5"],
  [/everton/i, "#003399", "#FFFFFF"], [/west ham/i, "#7A263A", "#1BB1E7"], [/brighton/i, "#0057B8", "#FFFFFF"],
  [/leeds/i, "#FFFFFF", "#1D428A"], [/crystal palace/i, "#1B458F", "#C4122E"], [/nottingham/i, "#DD0000", "#FFFFFF"],
  [/sunderland/i, "#EB172B", "#FFFFFF"], [/wolverhampton|wolves/i, "#FDB913", "#231F20"], [/fulham/i, "#FFFFFF", "#111111"],
  // Spain, Italy, Germany, France, Portugal, Netherlands
  [/real madrid/i, "#FFFFFF", "#00529F"], [/barcelona/i, "#A50044", "#004D98"], [/atl[eé]tico/i, "#CB3524", "#FFFFFF"],
  [/juventus/i, "#111111", "#FFFFFF"], [/\binter\b|internazionale/i, "#0068A8", "#111111"], [/\bmilan\b/i, "#FB090B", "#111111"],
  [/napoli/i, "#12A0D7", "#FFFFFF"], [/roma\b/i, "#8E1F2F", "#F0BC42"], [/lazio/i, "#87D8F7", "#FFFFFF"],
  [/bayern/i, "#DC052D", "#FFFFFF"], [/dortmund/i, "#FDE100", "#111111"], [/leverkusen/i, "#E32221", "#111111"],
  [/paris saint|psg/i, "#004170", "#DA291C"], [/marseille/i, "#2FAEE0", "#FFFFFF"], [/lyon/i, "#FFFFFF", "#DA0812"],
  [/benfica/i, "#E83030", "#FFFFFF"], [/porto/i, "#00428C", "#FFFFFF"], [/sporting/i, "#008057", "#FFFFFF"],
  [/ajax/i, "#FFFFFF", "#D2122E"], [/psv/i, "#ED1C24", "#FFFFFF"], [/feyenoord/i, "#E1000F", "#FFFFFF"],
];

const FALLBACK: [string, string][] = [
  ["#1D4FA3", "#FFFFFF"], ["#C8102E", "#FFFFFF"], ["#0E6B43", "#FFFFFF"], ["#111111", "#FFFFFF"],
  ["#F2C500", "#111111"], ["#6B2D8F", "#FFFFFF"], ["#E86A1C", "#111111"], ["#6CABDD", "#0D1B14"],
];

export function kit(name: string): [string, string] {
  for (const [re, a, b] of KITS) if (re.test(name)) return [a, b];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}
