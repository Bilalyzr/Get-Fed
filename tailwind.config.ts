import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: ["Melloida", "var(--font-display)", "Bodoni Moda", "Georgia", "serif"],
        display: ["Melloida", "var(--font-display)", "Bodoni Moda", "Georgia", "serif"],
      },
      colors: {
        // Color Hunt palette: fbf5dd / e7e1b1 / 306d29 / 0d530e
        page: "#fbf5dd",
        surface: {
          DEFAULT: "#ffffff",
          soft: "#e7e1b1",
        },
        warm: "#e7e1b1",
        primary: {
          DEFAULT: "#306d29",
          hover: "#0d530e",
          soft: "#4e8b45",
          faint: "#c5d9a8",
          wash: "#e7e1b1",
        },
        palette: {
          forest: "#0d530e",
          green: "#306d29",
          leaf: "#4e8b45",
          sage: "#c5d9a8",
          khaki: "#e7e1b1",
          cream: "#fbf5dd",
        },
        ink: "#0d530e",
        charcoal: "#2e4630",
        zen: {
          text: "#1f3a1d",
          muted: "#5c6e52",
          faint: "#93986f",
          border: "#e7e1b1",
          "border-strong": "#cfc68f",
          "border-faint": "#f3eed7",
        },
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(48, 80, 40, 0.06)",
        soft: "0 20px 60px rgba(48, 80, 40, 0.08)",
        elevated: "0 30px 90px rgba(24, 40, 20, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
