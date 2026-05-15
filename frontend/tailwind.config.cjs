module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        khilafat: {
          50: '#f7faf6',
          100: '#edf7ee',
          200: '#cfe8cf',
          300: '#a1cf9f',
          400: '#4da85e',
          500: '#257a36',
          600: '#1f5f2b',
          700: '#17441f',
          800: '#103114',
          900: '#08160a'
        },
        amber: {
          50: '#fff9f0',
          100: '#fff3df',
          200: '#fee4b6',
          300: '#fcd680',
          400: '#f8ba3f',
          500: '#f6a400',
          600: '#d38800',
          700: '#9a6200',
          800: '#6a4100',
          900: '#3d2500'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}
