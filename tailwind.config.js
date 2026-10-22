/** @type {import('tailwindcss').Config} */
// Design: "the coupon". Winner's paper coupon (match rows, 1/X/2 boxes marked by hand) on
// matchday pitch green. Paper and ink for reading, pitch green for structure and action,
// highlighter yellow only where something is marked: a pick, a value price, your selection.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF1EB", // page: cool, faintly green newsprint
        card: "#FFFFFF", // coupons and panels
        well: "#E4E9E3", // inputs, recessed areas
        line: "#D2DAD3",
        hover: "#E6ECE5",
        ink: { DEFAULT: "#0D1B14", muted: "#55665C", faint: "#8A988F" },
        accent: { DEFAULT: "#0E6B43", soft: "#0E6B431A", deep: "#09502F" }, // pitch green
        pitch: { DEFAULT: "#0E5A3A", deep: "#0A4129", line: "#3E8A65" },
        marker: { DEFAULT: "#FFE14D", deep: "#F2C500" }, // highlighter
        won: "#17905A",
        lost: "#D2432B",
        draw: "#8A968F",
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk Variable"', "system-ui", "sans-serif"],
        display: ['"Big Shoulders Display Variable"', '"Arial Narrow"', "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.1875rem", { lineHeight: "1.7rem" }],
        xl: ["1.5rem", { lineHeight: "1.8rem" }],
        "2xl": ["2.25rem", { lineHeight: "2.3rem" }],
        "3xl": ["3.25rem", { lineHeight: "3.1rem" }],
        "4xl": ["4.75rem", { lineHeight: "4.3rem" }],
        "5xl": ["6.5rem", { lineHeight: "5.8rem" }],
      },
      borderRadius: { card: "6px" },
      maxWidth: { page: "1240px" },
      boxShadow: {
        coupon: "0 1px 0 #D2DAD3, 0 18px 40px -18px rgba(13,27,20,0.35)",
      },
    },
  },
  plugins: [],
};
