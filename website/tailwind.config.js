/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif', 'Apple Color Emoji'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Academic color palette - muted, professional
        page: '#FFFFFF',
        subtle: '#FAFAFA',
        muted: '#F5F5F5',

        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
          tertiary: '#9B9B9B',
        },

        border: {
          light: '#E5E5E5',
          medium: '#D4D4D4',
        },

        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
          subtle: '#EFF6FF',
        },

        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },

        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },

        error: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },

        // Legacy FDA colors (for backwards compatibility)
        fda: {
          blue: '#2563EB',
          darkblue: '#1D4ED8',
          red: '#DC2626',
          green: '#059669',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      lineHeight: {
        'relaxed': '1.7',
        'loose': '1.85',
      },
      letterSpacing: {
        'normal': '0em',
        'slight': '0.01em',
      },
      maxWidth: {
        'prose': '65ch',
        'prose-wide': '75ch',
      },
    },
  },
  plugins: [],
}
