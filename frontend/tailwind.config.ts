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
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
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
          base: "#FFFFFF",
          elevated: "#F7F8FA",
          hover: "#F3F4F6",
          active: "#E5E7EB",
        },
        border: {
          primary: "#E5E7EB",
          strong: "#D1D5DB",
        },
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
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
