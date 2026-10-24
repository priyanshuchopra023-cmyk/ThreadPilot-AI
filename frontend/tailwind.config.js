/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Button variants - exact classes used in Button.tsx
    'bg-primary-600', 'hover:bg-primary-700', 'focus:ring-primary-500',
    'bg-secondary-100', 'hover:bg-secondary-200', 'focus:ring-secondary-500',
    'bg-danger-600', 'hover:bg-danger-700', 'focus:ring-danger-500',
    'bg-transparent', 'hover:bg-secondary-100', 'focus:ring-secondary-500',
    'border', 'border-secondary-300', 'bg-transparent', 'hover:bg-secondary-50',
    'bg-success-600', 'hover:bg-success-700', 'focus:ring-success-500',
    'text-white', 'text-secondary-700', 'text-danger-600', 'text-primary-600',
    'px-3', 'py-1.5', 'px-4', 'py-2', 'px-6', 'py-3',
    'text-sm', 'text-base', 'text-lg',
    'gap-1.5', 'gap-2', 'gap-2.5',
    // Input states - exact classes used in Input.tsx
    'border-danger-300', 'focus:ring-danger-500', 'focus:border-danger-500',
    'border-secondary-300', 'focus:ring-primary-500', 'focus:border-primary-500',
    'pl-10', 'pr-10',
    // Card variants - exact classes used in Card.tsx
    'bg-white', 'rounded-xl', 'shadow-sm', 'border', 'border-secondary-200',
    'shadow-md', 'hover:shadow-md', 'transition-shadow', 'cursor-pointer',
    // Badge variants - exact classes used in Badge.tsx
    'bg-success-100', 'text-success-800',
    'bg-warning-100', 'text-warning-800',
    'bg-danger-100', 'text-danger-800',
    'bg-primary-100', 'text-primary-800',
    'bg-secondary-100', 'text-secondary-800',
    // Size classes
    'px-2', 'py-0.5', 'px-2.5', 'py-1', 'text-xs',
    // Card parts
    'px-6', 'py-4', 'border-b', 'border-secondary-200',
    'bg-secondary-50', 'border-t',
    // Input states
    'pl-10', 'pr-10',
    // Loading spinner
    'animate-spin',
    // Icon sizes
    'w-4', 'h-4', 'w-5', 'h-5', 'w-6', 'h-6', 'w-8', 'h-8',
    // Modal sizes
    'max-w-md', 'max-w-lg', 'max-w-2xl', 'max-w-4xl', 'max-w-6xl',
    // Animations
    'animate-fade-in', 'animate-slide-up', 'animate-slide-down',
    'animate-slide-in-right', 'animate-slide-in-left', 'animate-pulse-soft',
    // Layout
    'flex', 'items-center', 'justify-center', 'gap-1', 'gap-2', 'gap-3', 'gap-4',
    'w-full', 'w-4', 'h-4', 'w-5', 'h-5', 'w-6', 'h-6', 'w-8', 'h-8',
    'w-10', 'h-10', 'w-12', 'h-12', 'w-16', 'h-16',
    // Rounded
    'rounded', 'rounded-lg', 'rounded-xl', 'rounded-full',
    // Colors for dynamic classes
    'bg-primary-50', 'bg-primary-100', 'bg-primary-600',
    'bg-success-50', 'bg-success-100', 'bg-success-600',
    'bg-warning-50', 'bg-warning-100', 'bg-warning-600',
    'bg-danger-50', 'bg-danger-100', 'bg-danger-600',
    'text-success-600', 'text-success-800', 'text-warning-600', 'text-warning-800',
    'text-danger-600', 'text-danger-800', 'text-primary-600', 'text-primary-800',
    'border-primary-200', 'border-success-200', 'border-warning-200', 'border-danger-200',
    'hover:bg-primary-50', 'hover:bg-success-50', 'hover:bg-warning-50', 'hover:bg-danger-50',
    // Text colors
    'text-secondary-400', 'text-secondary-500', 'text-secondary-600', 'text-secondary-700',
    'text-secondary-800', 'text-secondary-900',
    // Border colors
    'border-secondary-200', 'border-secondary-300', 'border-secondary-500',
    // Shadow
    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
    // Spacing
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'px-2', 'px-3', 'px-4', 'px-6',
    'py-1', 'py-2', 'py-3', 'py-4', 'px-2', 'px-3', 'px-4',
    'mb-1', 'mb-2', 'mb-4', 'mt-1', 'mt-2', 'mt-4',
    'gap-1', 'gap-1.5', 'gap-2', 'gap-2.5', 'gap-3', 'gap-4',
    // Positioning
    'absolute', 'relative', 'inset-y-0', 'left-0', 'right-0', 'pl-3', 'pr-3',
    'top-1/2', '-translate-y-1/2',
    // Flex
    'flex', 'items-center', 'justify-center', 'gap-1', 'gap-1.5', 'gap-2', 'gap-2.5', 'gap-3', 'gap-4',
    // Width/Height
    'w-4', 'h-4', 'w-5', 'h-5', 'w-6', 'h-6', 'w-8', 'h-8',
    'w-10', 'h-10', 'w-12', 'h-12', 'w-16', 'h-16',
    'max-w-md', 'max-w-lg', 'max-w-2xl', 'max-w-4xl', 'max-w-6xl',
    'min-h-screen', 'min-h-[70vh]', 'max-h-[70vh]', 'overflow-y-auto',
    // Grid
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6',
    'col-span-2', 'col-span-6',
    // Text alignment
    'text-left', 'text-center', 'text-right',
    // Transform
    'transform', 'transition-all', 'duration-200', 'duration-300', 'ease-in-out',
    // Animation
    'animate-fade-in', 'animate-slide-up', 'animate-slide-down',
    'animate-slide-in-right', 'animate-slide-in-left', 'animate-pulse-soft',
    // Text decoration
    'truncate', 'whitespace-pre-wrap',
    // Cursor
    'cursor-pointer', 'cursor-not-allowed', 'pointer-events-none',
    // Background
    'bg-primary-600', 'bg-secondary-100', 'bg-danger-600', 'bg-success-600',
    'bg-white', 'bg-secondary-50', 'bg-primary-50', 'bg-primary-100',
    'bg-secondary-100', 'bg-secondary-200', 'bg-secondary-300',
    // Border
    'border', 'border-secondary-200', 'border-secondary-300', 'border-danger-300',
    // Resize
    'resize-none',
    // Opacity
    'opacity-25', 'opacity-75',
    // Z-index
    'z-50', 'z-40', 'z-30',
    // Fixed positioning
    'fixed', 'inset-0', 'left-0', 'right-0', 'top-0', 'bottom-0',
    // Margin
    'mx-auto', 'mr-2', 'ml-2', 'mt-2', 'mb-2', 'mx-4', 'my-2',
    // Padding
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6',
    // Text
    'text-primary-600', 'text-primary-700', 'text-secondary-400', 'text-secondary-500',
    'text-secondary-600', 'text-secondary-600', 'text-secondary-700', 'text-secondary-800',
    'text-secondary-900', 'text-white', 'text-danger-600', 'text-success-600',
    'text-warning-600', 'text-primary-800', 'text-success-800', 'text-warning-800',
    'text-danger-800',
    // Font
    'font-medium', 'font-bold', 'font-semibold', 'font-normal',
    // Line height
    'leading-1.5', 'leading-1.4', 'leading-1.3', 'leading-1.2',
    // Object fit
    'object-cover', 'object-contain',
    // Pointer events
    'pointer-events-none', 'pointer-events-auto',
    // Visibility
    'invisible', 'visible',
    // Overflow
    'overflow-hidden', 'overflow-auto', 'overflow-y-auto',
    // Scrollbar
    'scrollbar-thin',
    // Additional classes used in components
    'bg-brass-600', 'hover:bg-brass-700', 'focus:ring-brass-500',
    'text-brass-600', 'text-brass-800',
    'bg-brass-50', 'bg-brass-100', 'border-brass-200',
    'hover:bg-brass-50',
    'text-brass-600', 'text-brass-800',
    'bg-primary-600', 'hover:bg-primary-700', 'focus:ring-primary-500',
    'bg-secondary-100', 'hover:bg-secondary-200', 'focus:ring-secondary-500',
    'bg-danger-600', 'hover:bg-danger-700', 'focus:ring-danger-500',
    'bg-transparent', 'hover:bg-secondary-100', 'focus:ring-secondary-500',
    'border', 'border-secondary-300', 'bg-transparent', 'hover:bg-secondary-50',
    'bg-success-600', 'hover:bg-success-700', 'focus:ring-success-500',
    'text-white', 'text-secondary-700', 'text-danger-600', 'text-primary-600',
    'px-3', 'py-1.5', 'px-4', 'py-2', 'px-6', 'py-3',
    'text-sm', 'text-base', 'text-lg',
    'gap-1.5', 'gap-2', 'gap-2.5',
    'rounded-lg', 'rounded-xl', 'rounded-full',
    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
    'transition-colors', 'transition-shadow', 'duration-150', 'duration-200',
    'disabled:opacity-50', 'disabled:cursor-not-allowed',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2',
    'hover:bg-primary-700', 'hover:bg-secondary-200', 'hover:bg-danger-700',
    'hover:bg-secondary-100', 'hover:bg-success-700',
    'focus:ring-primary-500', 'focus:ring-secondary-500', 'focus:ring-danger-500',
    'focus:ring-success-500', 'focus:ring-secondary-500',
    'overflow-hidden', 'overflow-auto', 'overflow-y-auto',
    'w-4', 'h-4', 'w-5', 'h-5', 'w-6', 'h-6', 'w-8', 'h-8',
    'w-10', 'h-10', 'w-12', 'h-12', 'w-16', 'h-16',
    'max-w-md', 'max-w-lg', 'max-w-2xl', 'max-w-4xl', 'max-w-6xl',
    'min-h-screen', 'min-h-[70vh]', 'max-h-[70vh]', 'overflow-y-auto',
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6',
    'col-span-2', 'col-span-6',
    'text-left', 'text-center', 'text-right',
    'transform', 'transition-all', 'duration-200', 'duration-300', 'ease-in-out',
    'animate-fade-in', 'animate-slide-up', 'animate-slide-down',
    'animate-slide-in-right', 'animate-slide-in-left', 'animate-pulse-soft',
    'truncate', 'whitespace-pre-wrap',
    'cursor-pointer', 'cursor-not-allowed', 'pointer-events-none',
    'bg-primary-600', 'bg-secondary-100', 'bg-danger-600', 'bg-success-600',
    'bg-white', 'bg-secondary-50', 'bg-primary-50', 'bg-primary-100',
    'bg-secondary-100', 'bg-secondary-200', 'bg-secondary-300',
    'border', 'border-secondary-200', 'border-secondary-300', 'border-danger-300',
    'resize-none',
    'opacity-25', 'opacity-75',
    'z-50', 'z-40', 'z-30',
    'fixed', 'inset-0', 'left-0', 'right-0', 'top-0', 'bottom-0',
    'mx-auto', 'mr-2', 'ml-2', 'mt-2', 'mb-2', 'mx-4', 'my-2',
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6',
    'text-primary-600', 'text-primary-700', 'text-secondary-400', 'text-secondary-500',
    'text-secondary-600', 'text-secondary-600', 'text-secondary-700', 'text-secondary-800',
    'text-secondary-900', 'text-white', 'text-danger-600', 'text-success-600',
    'text-warning-600', 'text-primary-800', 'text-success-800', 'text-warning-800',
    'text-danger-800',
    'font-medium', 'font-bold', 'font-semibold', 'font-normal',
    'leading-1.5', 'leading-1.4', 'leading-1.3', 'leading-1.2',
    'object-cover', 'object-contain',
    'pointer-events-none', 'pointer-events-auto',
    'invisible', 'visible',
    'overflow-hidden', 'overflow-auto', 'overflow-y-auto',
    'scrollbar-thin',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Deep navy/indigo as specified
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#142B4A', // Primary navy: #142B4A
          950: '#0c1a2e',
        },
        // Secondary: Steel blue #5276A5
        secondary: {
          50: '#f5f7fa',  // Page canvas: #F5F7FA
          100: '#eef1f5',
          200: '#d9dfe8',
          300: '#bcc3d1',
          400: '#9aa3b8',
          500: '#7a8a9f',
          600: '#5276A5', // Steel blue: #5276A5
          700: '#42608a',
          800: '#364d6e',
          900: '#2e3e54',
          950: '#1f283a',
        },
        // Semantic colors - restrained and accessible
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Brass accent - used sparingly
        brass: {
          50: '#fdf8f0',
          100: '#faf0db',
          200: '#f4e1b7',
          300: '#ebe0a0',
          400: '#e6d989',
          500: '#d9c86d',  // Muted brass: #C6A875
          600: '#c6a875',  // Primary brass accent
          700: '#a88f5e',
          800: '#8f774f',
          900: '#7a6442',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.15s ease-out',
        'slide-in-left': 'slideInLeft 0.15s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}