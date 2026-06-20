/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        clutch: {
          bg: "#121216",
          panel: "#202024",
          panelSoft: "#28282D",
          border: "#33333A",
          text: "#F5F5F7",
          muted: "#A1A1AA",
          cyan: "#38BDF8",
          blue: "#35B8FF",
          violet: "#A78BFA",
          green: "#34D399",
          amber: "#FBBF24",
          red: "#F87171"
        }
      },
      boxShadow: {
        card: "none",
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
