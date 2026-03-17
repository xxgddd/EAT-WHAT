/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        ivory: {
          50: '#FDFCFA',
          100: '#FAF7F2',
          200: '#F0EBE0',
          300: '#E8E2DA',
        },
        green: {
          primary: '#4A7C59',
          light: '#6A9E78',
          pale: '#EAF2EC',
          dark: '#375E43',
        },
        terra: {
          DEFAULT: '#E07A5F',
          light: '#F2C5B8',
          pale: '#FDF0EC',
          dark: '#C4614A',
        },
        ink: {
          DEFAULT: '#2D2D2D',
          secondary: '#6B6560',
          muted: '#9E9890',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
        '5xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(45,45,45,0.06)',
        'card-hover': '0 4px 24px rgba(45,45,45,0.10)',
        soft: '0 1px 4px rgba(45,45,45,0.08)',
        float: '0 8px 32px rgba(45,45,45,0.12)',
      },
      animation: {
        'spring-in': 'springIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fade-up': 'fadeUp 0.35s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.6s ease-in-out',
      },
      keyframes: {
        springIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
};
