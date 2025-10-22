/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin'); // Plugin'i içe aktarın

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      aspectRatio: {
        video: '16/9',
      },
      animation: {
        float: 'float 3s linear infinite',
        shake: 'shake 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%': {
            transform: 'translateY(0) scale(0)',
            opacity: '0',
          },
          '10%': {
            opacity: '1',
          },
          '90%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(-120vh) scale(1)',
            opacity: '0',
          },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -20px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        fadeInDown: {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, 0)',
          },
        },
      },
      transitionProperty: {
        left: 'left',
      },
    },
  },
  // Plugins kısmına eklemeyi yapıyoruz
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.slider-thumb': {
          '&::-webkit-slider-thumb': {
            '-webkit-appearance': 'none',
            appearance: 'none',
            height: '16px',
            width: '16px',
            'border-radius': '50%',
            background: '#ffffff', // Beyaz renk
            cursor: 'pointer',
            // İsteğe bağlı gölge, Tailwind box-shadow karşılığı: shadow-md
            'box-shadow':
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },

          '&::-moz-range-thumb': {
            height: '16px',
            width: '16px',
            'border-radius': '50%',
            background: '#ffffff', // Beyaz renk
            cursor: 'pointer',
            border: 'none',
            'box-shadow':
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          },
        },
      });
    }),
  ],
};
