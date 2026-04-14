import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f4efe6",
        ink: "#10202d",
        coral: "#ff6a3d",
        teal: "#1d7b72",
        gold: "#d59d18"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(16, 32, 45, 0.12)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(16, 32, 45, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 32, 45, 0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
