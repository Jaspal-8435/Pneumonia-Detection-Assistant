import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        clinic: {
          primary: "#0f766e",
          secondary: "#475569",
          accent: "#b7791f",
          neutral: "#27373f",
          "base-100": "#f6faf8",
          "base-200": "#edf4f1",
          "base-300": "#d6e2dd",
          info: "#2563eb",
          success: "#15803d",
          warning: "#b7791f",
          error: "#dc2626",
        },
      },
    ],
  },
};
