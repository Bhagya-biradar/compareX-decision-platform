/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 60px rgba(12, 12, 14, 0.25)',
        panel: '0 24px 90px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top left, rgba(156, 163, 175, 0.14), transparent 34%), radial-gradient(circle at top right, rgba(38, 38, 42, 0.55), transparent 24%), linear-gradient(180deg, rgba(2, 2, 3, 0.98), rgba(17, 17, 19, 1))',
        'panel-gradient': 'linear-gradient(145deg, rgba(10, 10, 12, 0.95), rgba(25, 25, 28, 0.92))',
      },
    },
  },
  plugins: [],
};
