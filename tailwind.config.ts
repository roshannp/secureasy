import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", /* dark: only when .dark present - we never add it */
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        secure: {
          dark: "#0d0d0d",
          card: "#f7f7f8",
          accent: "#0d0d0d",
          warning: "#92400e",
          danger: "#b91c1c",
        },
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
