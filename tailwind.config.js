/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0C1424", raised: "#131E33", sunk: "#091020", line: "#24324D", hover: "#1A2741" },
        chalk: { DEFAULT: "#E9EEF6", muted: "#8B98AE", faint: "#5D6B84" },
        amber: { DEFAULT: "#F5B83D", soft: "#F5B83D26", deep: "#C98F1A" },
        won: "#46C38A",
        lost: "#E8705F",
        draw: "#7F8DA6",
      },
      fontFamily: {
        sans: ['"Archivo Variable"', "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.1875rem", { lineHeight: "1.7rem" }],
        xl: ["1.5rem", { lineHeight: "1.9rem" }],
        "2xl": ["2rem", { lineHeight: "2.3rem" }],
        "3xl": ["2.75rem", { lineHeight: "2.9rem" }],
        "4xl": ["3.75rem", { lineHeight: "3.8rem" }],
      },
      borderRadius: { card: "14px" },
      maxWidth: { page: "1200px" },
    },
  },
  plugins: [],
};
