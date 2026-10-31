/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F7F9F8',
        },
        text: {
          primary: '#172B32',
          secondary: '#596A70',
        },
        brand: {
          DEFAULT: '#137C72',
          hover: '#0E6058',
          subtle: '#E8F3F1',
        },
        border: {
          DEFAULT: '#DCE5E3',
          subtle: '#E6ECEB',
        },
        status: {
          success: '#237A57',
          'success-bg': '#EAF5F0',
          warning: '#B7791F',
          'warning-bg': '#FEF7EC',
          danger: '#B42332',
          'danger-bg': '#FDF2F2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(23, 43, 50, 0.05)',
        'card': '0 1px 3px 0 rgba(23, 43, 50, 0.06), 0 1px 2px -1px rgba(23, 43, 50, 0.04)',
      }
    },
  },
  plugins: [],
}
