
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prime: {
          blue: "#004AAD",
          gray: "#F5F5F5",
        }
      }
    },
  },
  plugins: [],
}
