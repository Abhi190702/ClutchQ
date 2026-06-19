/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        clutch: {
          bg: "#0B1020",
          panel: "#111827",
          panelSoft: "#151E2E",
          border: "#263244",
          text: "#F8FAFC",
          muted: "#A8B3C7",
          cyan: "#38BDF8",
          blue: "#60A5FA",
          violet: "#A78BFA",
          green: "#34D399",
          amber: "#FBBF24",
          red: "#F87171"
        }
      },
      boxShadow: {
        card: "0 1px 0 rgba(255, 255, 255, 0.03)",
        cyan: "0 0 0 rgba(0, 0, 0, 0)"
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: "0.35", transform: "scaleX(0.92)" },
          "50%": { opacity: "1", transform: "scaleX(1)" }
        },
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        pulseLine: "pulseLine 2.4s ease-in-out infinite",
        floatUp: "floatUp 0.5s ease-out both"
      }
    }
  },
  plugins: []
};
