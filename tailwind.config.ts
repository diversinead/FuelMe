import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
        },
        ink: {
          DEFAULT: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          tertiary: "var(--ink-tertiary)",
          inverse: "var(--ink-inverse)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          muted: "var(--accent-muted)",
          ring: "var(--accent-ring)",
        },
        session: {
          easy: "var(--session-easy)",
          hard: "var(--session-hard)",
          long: "var(--session-long)",
          rest: "var(--session-rest)",
          custom: "var(--session-custom)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Fraunces only used inside print routes
        fraunces: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
      fontSize: {
        "display-xl": [
          "56px",
          { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "700" },
        ],
        "display-lg": [
          "40px",
          { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" },
        ],
        "display-md": [
          "28px",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-sm": [
          "20px",
          { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
        "body-lg": ["17px", { lineHeight: "1.5" }],
        body: ["15px", { lineHeight: "1.5" }],
        "body-sm": ["13px", { lineHeight: "1.5" }],
        "mono-lg": ["15px", { lineHeight: "1.4", letterSpacing: "0" }],
        mono: ["12px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        "mono-sm": ["10.5px", { lineHeight: "1.4", letterSpacing: "0.06em" }],
      },
      borderRadius: {
        card: "16px",
        button: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
