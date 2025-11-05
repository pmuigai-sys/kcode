import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        "kb-bg": "#0f172a",
        "kb-panel": "#111827",
        "kb-primary": "#38bdf8",
        "kb-secondary": "#22d3ee"
      },
      boxShadow: {
        softer: "0 10px 30px rgba(15, 23, 42, 0.4)"
      }
    }
  },
  plugins: []
} satisfies Config;
