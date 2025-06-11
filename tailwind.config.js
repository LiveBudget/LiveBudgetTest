/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "w-[60px]",
    "w-[80px]",
    "w-[100px]",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
