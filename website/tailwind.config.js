/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fda: {
          blue: '#005ea2',
          darkblue: '#1a4480',
          red: '#e52207',
          green: '#00a91c',
        },
      },
    },
  },
  plugins: [],
}
