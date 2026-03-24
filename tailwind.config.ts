import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px"
      }
    },
    extend: {
      colors: {
        background: "#000000",
        surface: "#1c1c1e",
        card: "#1c1c1e",
        border: "#3a3a3c",
        text: "#ffffff",
        muted: "#8e8e93",
        accent: "#0a84ff",
        accentSoft: "#0a84ff33",
        success: "#30d158",
        danger: "#ff453a"
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
        "squircle": "22.5%",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.4)",
        inset: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        "ios-icon": "0 2px 8px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.15)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-sora)", "ui-sans-serif", "system-ui"]
      },
      backgroundImage: {
        glow: "radial-gradient(circle at top, rgba(10,132,255,0.18), transparent 55%)",
        haze: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 35%)"
      }
    }
  },
  plugins: []
};

export default config;
