/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ice: {
          DEFAULT: '#EAF6FF',
          light: '#F4FAFF',
          dark: '#D5EBFC',
        },
        navy: {
          DEFAULT: '#142B4A',
          hover: '#1D3D63',
          muted: '#334E73',
        },
        tangerine: {
          DEFAULT: '#FF8C42',
          hover: '#E8752E',
          tint: '#FFF1E6',
        },
        disabled: {
          bg: '#D1D5DB',
          text: '#6B7280',
        },
      },
    },
  },
  plugins: [],
};
