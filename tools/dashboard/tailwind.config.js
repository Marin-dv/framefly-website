/** The demo dashboard (../../dashboard.html): Tailwind 3 + daisyUI 4 components, themed with the site's lime. Build: npm install && npm run build */
module.exports = {
  content: ["../../dashboard.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Gabarito", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    logs: false,
    themes: [
      {
        framefly: {
          primary: "#d3f261",
          "primary-content": "#12150a",
          secondary: "#6bd0a1",
          "secondary-content": "#07140e",
          accent: "#b7d83c",
          "accent-content": "#12150a",
          neutral: "#1c2014",
          "neutral-content": "#eef0e6",
          "base-100": "#ffffff",
          "base-200": "#f4f5f0",
          "base-300": "#e3e6da",
          "base-content": "#1a1d14",
          info: "#3b82f6",
          success: "#2a8f5e",
          warning: "#b87400",
          error: "#d04040",
          "--rounded-box": "1.1rem",
          "--rounded-btn": "999px",
          "--rounded-badge": "999px",
        },
      },
      {
        "framefly-dark": {
          primary: "#d3f261",
          "primary-content": "#12150a",
          secondary: "#6bd0a1",
          "secondary-content": "#07140e",
          accent: "#b7d83c",
          "accent-content": "#12150a",
          neutral: "#2b3022",
          "neutral-content": "#eef0e6",
          "base-100": "#171a12",
          "base-200": "#0f110b",
          "base-300": "#262b1e",
          "base-content": "#e8ebdd",
          info: "#6aa4ff",
          success: "#5fd39a",
          warning: "#f0b34a",
          error: "#f08585",
          "--rounded-box": "1.1rem",
          "--rounded-btn": "999px",
          "--rounded-badge": "999px",
        },
      },
    ],
  },
};
