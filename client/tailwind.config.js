/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        clutch: {
          bg: "#090A0E",
          panel: "#14161C",
          panelSoft: "#1B1E26",
          border: "#2A2E38",
          text: "#F7F8FB",
          muted: "#9CA3AF",
          cyan: "#47C6FF",
          blue: "#3DBBFA",
          violet: "#8E90FF",
          green: "#37D8A4",
          amber: "#F4BF4F",
          red: "#FF7A83"
        }
      },
      boxShadow: {
        card: "0 24px 70px rgba(0, 0, 0, 0.28)",
        cyan: "0 18px 40px rgba(61, 187, 250, 0.18)"
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
