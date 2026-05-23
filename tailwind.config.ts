import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bmw: {
          blue: "#003399",
          "blue-light": "#0066CC",
          white: "#FFFFFF",
          gray: "#F5F5F5",
          "gray-dark": "#E0E0E0",
          "text-secondary": "#666666",
          danger: "#CC0000",
          success: "#006600",
          warning: "#CC6600",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
