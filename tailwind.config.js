/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#1e1f22',
          secondary: '#2b2d31',
          tertiary: '#36393f',
          text: '#f2f3f5',
        },
        light: {
          primary: '#ffffff',
          secondary: '#f2f3f5',
          tertiary: '#e3e5e8',
          text: '#2b2d31',
        },
      },
    },
  },
  plugins: [],
}