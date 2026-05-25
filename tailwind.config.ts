import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        tea: "#5f7f95",
        paper: "#ffffff",
        clay: "#c9822b",
        mist: "#e9f2f7"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(36, 35, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

