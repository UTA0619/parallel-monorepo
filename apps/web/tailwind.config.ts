import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parallel: {
          bg:      "#0A0B0F",
          surface: "#141620",
          border:  "#1E2130",
          accent:  "#7B6CF6",
          warm:    "#F6A26C",
          muted:   "#4A5170",
          text:    "#E8EAF0",
          dim:     "#8892A8",
        },
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "sans-serif"],
        body:    ["var(--font-inter)", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "pulse-slow":    "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in":       "fadeIn 0.6s ease forwards",
        "slide-up":      "slideUp 0.5s ease forwards",
        "glow-accent":   "glowAccent 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        glowAccent:{ "0%,100%": { boxShadow: "0 0 20px rgba(123,108,246,0.2)" }, "50%": { boxShadow: "0 0 40px rgba(123,108,246,0.5)" } },
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
} satisfies Config;
