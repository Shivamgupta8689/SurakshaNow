/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A0F1E',
          900: '#0D1526',
          850: '#101B30',
          800: '#161B2B',
          750: '#1A1F2F',
          700: '#1E2A3A',
          600: '#25293A',
          500: '#2F3445',
          400: '#343949',
        },
        accent: {
          red: '#D32F2F',
          'red-dark': '#B71C1C',
          'red-light': '#FF5252',
        },
        status: {
          success: '#2E7D32',
          warning: '#E65100',
          info: '#1565C0',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8A9BB0',
          muted: '#5A6A7E',
        },
        border: {
          DEFAULT: '#1E2A3A',
          light: '#2A3A4E',
        },
        crisis: {
          teal: '#004D40',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
      },
      animation: {
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'progress': 'progress 2.5s ease-in-out infinite',
        'countdown': 'countdown 1s linear infinite',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': { borderColor: '#D32F2F', opacity: '1' },
          '50%': { borderColor: '#FF5252', opacity: '0.7' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}
