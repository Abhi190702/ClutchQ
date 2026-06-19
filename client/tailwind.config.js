/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        clutch: {
          bg: "#070A12",
          panel: "#0F172A",
          panelSoft: "#111827",
          border: "#1E293B",
          text: "#F8FAFC",
          muted: "#94A3B8",
          cyan: "#22D3EE",
          blue: "#3B82F6",
          violet: "#8B5CF6",
          green: "#22C55E",
          amber: "#F59E0B",
          red: "#EF4444"
        }
      },
      boxShadow: {
        card: "0 18px 60px rgba(2, 6, 23, 0.28)",
        cyan: "0 0 28px rgba(34, 211, 238, 0.18)"
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
