import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f5ff",
          100: "#e0ebff",
          400: "#464c89",
          500: "#003f5c",
          600: "#002d42",
          700: "#001f2e",
          900: "#000914",
        },
        secondary: {
          500: "#954e9b",
        },
        accent: {
          pink: "#dd4d88",
          orange: "#ff6b59",
          gold: "#ffa600",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",
        },
        surface: {
          base: "#0a0e27",
          elevated: "#151a35",
          hover: "#1f2947",
        },
        border: {
          primary: "#2a2f4a",
        },
        text: {
          primary: "#f5f5f5",
          secondary: "#a0a5b8",
          tertiary: "#6b7280",
        },
      },
      fontFamily: {
        "fira-code": ["Fira Code", ...defaultTheme.fontFamily.mono],
        "fira-sans": ["Fira Sans", ...defaultTheme.fontFamily.sans],
      },
      backgroundColor: {
        base: "#0a0e27",
      },
      borderColor: {
        primary: "#2a2f4a",
      },
    },
  },
  plugins: [],
}

export default config
