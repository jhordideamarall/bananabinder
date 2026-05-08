import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        banan: {
          blue: "#7EC8E3",
          pink: "#F2A7C3",
          yellow: "#F9E79F",
          "blue-dark": "#5BA4C4",
          "pink-dark": "#D98AA8",
          "yellow-dark": "#E5D07A",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
};

export default config;
