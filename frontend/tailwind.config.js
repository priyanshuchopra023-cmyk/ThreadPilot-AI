/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Primary: Navy #142B4A
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#627D98',
          500: '#486581',
          600: '#334E68',
          700: '#243B53',
          800: '#182E4B',
          900: '#142B4A', // Signature Primary Navy
          950: '#0A1728',
        },
        // Brand Interactive: Muted Steel Blue #5276A5
        blue: {
          50: '#F2F6FA',
          100: '#E1EBF5',
          200: '#C4D7EB',
          300: '#9CBEE0',
          400: '#6D9BD0',
          500: '#5276A5', // Signature Muted Blue
          600: '#40628E',
          700: '#2E4C74',
          800: '#203756',
          900: '#15253C',
        },
        // Brand Accent: Warm Brass #C6A875
        brass: {
          50: '#FAF8F4',
          100: '#F4EFE6',
          200: '#E7DCBE',
          300: '#DAC896',
          400: '#D0B880',
          500: '#C6A875', // Signature Warm Brass Accent
          600: '#B09059',
          700: '#8E7340',
          800: '#6C562D',
          900: '#4B3A1C',
        },
        // Backward-compatible primary mapped to Brand Navy / Interactive Blue
        primary: {
          50: '#F0F4F8',
          100: '#E1EBF5',
          200: '#C4D7EB',
          300: '#9CBEE0',
          400: '#6D9BD0',
          500: '#5276A5',
          600: '#142B4A', // Primary Navy for buttons and brand hero
          700: '#0F213A',
          800: '#0B182B',
          900: '#07101D',
          950: '#040912',
        },
        // Backward-compatible secondary mapped to Cool Slate / Canvas
        secondary: {
          50: '#F5F7FA',  // Signature Canvas: #F5F7FA
          100: '#EBF0F5',
          200: '#E2E8F0', // Signature Subtle Border: #E2E8F0
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B', // Cool Slate Gray
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F1D32', // Primary Charcoal Text
          950: '#070E1A',
        },
        // Accessible Semantic Feedback Colors
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(15 29 50 / 0.04)',
        'sm': '0 1px 3px 0 rgb(15 29 50 / 0.06), 0 1px 2px -1px rgb(15 29 50 / 0.06)',
        'md': '0 4px 6px -1px rgb(15 29 50 / 0.07), 0 2px 4px -2px rgb(15 29 50 / 0.07)',
        'lg': '0 10px 15px -3px rgb(15 29 50 / 0.08), 0 4px 6px -4px rgb(15 29 50 / 0.08)',
        'xl': '0 20px 25px -5px rgb(15 29 50 / 0.09), 0 8px 10px -6px rgb(15 29 50 / 0.09)',
        'card': '0 1px 3px 0 rgb(20 43 74 / 0.05), 0 1px 2px -1px rgb(20 43 74 / 0.04)',
        'card-hover': '0 10px 20px -5px rgb(20 43 74 / 0.08), 0 4px 6px -2px rgb(20 43 74 / 0.04)',
        'brass': '0 4px 14px 0 rgb(198 168 117 / 0.25)',
        'inner-soft': 'inset 0 2px 4px 0 rgb(15 29 50 / 0.04)',
      },
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.625rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
