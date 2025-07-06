/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        leagueGothic: ["League Gothic", "sans-serif"],
      },
      colors: {
        primarioDark: "#34373C",
        darkBox: "#282733",
        darkBoxSub: "#363540",
        primario: "#F8F8F8",
        primarioLogo: "#DC569D",
      },
    },
  },
  plugins: [],
};
