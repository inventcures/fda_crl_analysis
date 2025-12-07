/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        fda: {
          blue: '#005ea2',
          darkblue: '#1a4480',
          red: '#e52207',
          green: '#00a91c',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      lineHeight: {
        'relaxed': '1.75',
        'loose': '1.85',
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.011em',
      },
      maxWidth: {
        'prose': '65ch',
        'prose-wide': '75ch',
      },
    },
  },
  plugins: [],
}
