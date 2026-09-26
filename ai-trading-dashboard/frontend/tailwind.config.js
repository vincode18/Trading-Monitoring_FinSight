/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0E1117',
        panel: '#161B22',
        'panel-hover': '#1C222C',
        border: '#2A313C',
        'border-card': '#333B48',
        'border-muted': '#1F252E',
        'text-primary': '#F0F3F6',
        'text-secondary': '#8B949E',
        'text-muted': '#5C6673',
        positive: '#00E676',
        negative: '#FF5252',
        neutral: '#8B949E',
        'action-primary': '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        display: ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }],
        h1: ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        h2: ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      letterSpacing: {
        label: '0.04em',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        panel: '12px',
      },
      boxShadow: {
        panel: '0 0 0 1px #333B48',
      },
    },
  },
  plugins: [],
};
