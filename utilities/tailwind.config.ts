import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        "card": "0 10px 30px rgba(8, 18, 32, 0.08)",
        "card-hover": "0 16px 40px rgba(8, 18, 32, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
