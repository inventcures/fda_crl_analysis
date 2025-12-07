/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-ubuntu-mono)', 'SF Mono', 'monospace'],
      },
      colors: {
        // Premium, human-centric palette
        page: '#FFFFFF',
        subtle: '#F8FAFC', // Slate-50

        text: {
          primary: '#031863', // Deep Navy (Body text from reference)
          secondary: '#475569', // Slate-600
          heading: '#2B2B2B', // Dark Gray (Headings from reference)
        },

        border: {
          light: '#E2E8F0', // Slate-200
          medium: '#CBD5E1', // Slate-300
        },

        accent: {
          DEFAULT: '#3B82F6', // Blue-500 (Vibrant but not default blue)
          hover: '#2563EB',
          light: '#EFF6FF',
          subtle: '#DBEAFE',
        },

        // Data visualization colors
        chart: {
          1: '#3B82F6', // Blue
          2: '#F59E0B', // Amber
          3: '#10B981', // Emerald
          4: '#8B5CF6', // Violet
          5: '#EC4899', // Pink
        },

        success: {
          DEFAULT: '#10B981', // Emerald-500
          light: '#D1FAE5',
        },

        warning: {
          DEFAULT: '#F59E0B', // Amber-500
          light: '#FEF3C7',
        },

        error: {
          DEFAULT: '#EF4444', // Red-500
          light: '#FEE2E2',
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
