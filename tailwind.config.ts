import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { navy: "#153C88", primary: "#2563EB", teal: "#0D9488" } } },
  plugins: []
} satisfies Config;
