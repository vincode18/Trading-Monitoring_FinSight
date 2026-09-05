/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Base surface ---
        canvas: '#0E1117',      // background utama, deep navy-charcoal
        panel: '#161B22',       // panel/card, dark slate
        'panel-hover': '#1C222C',
        border: '#2A313C',      // subtle grey border
        'border-muted': '#1F252E',

        // --- Text ---
        'text-primary': '#F0F3F6',
        'text-secondary': '#8B949E',
        'text-muted': '#5C6673',

        // --- Status / accent ---
        positive: '#00E676',    // neon green — naik/status baik
        negative: '#FF5252',    // merah — turun/status buruk (pasangan wajib untuk trading UI)
        neutral: '#8B949E',
        'action-primary': '#FFFFFF', // crisp white untuk primary action buttons
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1rem' }],   // 11px — table dense rows
        sm: ['0.8125rem', { lineHeight: '1.2rem' }], // 13px
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
      },
    },
  },
  plugins: [],
};
