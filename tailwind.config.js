/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // cursor: {
      //   // 'icon-pen' sınıfı artık FaPen ikonunuzu kullanacak
      //   'icon-pen': `${PEN_CURSOR}, crosshair`,
      //   // 'icon-eraser' sınıfı artık FaEraser ikonunuzu kullanacak
      //   'icon-eraser': `${ERASER_CURSOR}, grab`,
      //   'icon-eraser': `${ERASER_CURSOR}, grab`,
      //   // Diğer varsayılan imleçler için anahtar kelimeler
      //   'default-text': 'text',
      //   'default-zoom': 'zoom-in',
      // },
    },
  },
  plugins: [],
};
