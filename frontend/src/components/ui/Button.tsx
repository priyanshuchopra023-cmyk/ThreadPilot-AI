import React from 'react';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'brass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variantClasses = {
      // Primary: Deep Navy with subtle shadow and border
      primary:
        'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 focus:ring-blue-500 shadow-sm border border-navy-800/80',
      // Secondary: Soft canvas blend with crisp border
      secondary:
        'bg-white text-secondary-700 hover:bg-secondary-50 active:bg-secondary-100 border border-secondary-200/90 shadow-xs focus:ring-blue-500',
      // Danger: Accessible bold red
      danger:
        'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500 shadow-xs',
      // Ghost: Borderless hover highlight
      ghost:
        'bg-transparent hover:bg-secondary-100/80 active:bg-secondary-200/70 text-secondary-700 hover:text-secondary-900 focus:ring-blue-500',
      // Outline: Subtle border with interactive hover
      outline:
        'border border-secondary-300/80 bg-white hover:bg-secondary-50 active:bg-secondary-100 text-secondary-700 focus:ring-blue-500 shadow-xs',
      // Success: Accessible emerald
      success:
        'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500 shadow-xs',
      // Brass: Signature warm champagne brass accent for premium enterprise actions
      brass:
        'bg-gradient-to-r from-brass-300 via-brass-400 to-brass-300 text-navy-950 font-semibold hover:from-brass-200 hover:to-brass-300 active:from-brass-400 active:to-brass-500 focus:ring-brass-500 shadow-brass border border-brass-400/50',
    };

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs font-medium gap-1.5',
      md: 'px-3.5 py-2 text-sm font-medium gap-2',
      lg: 'px-5 py-2.5 text-base font-semibold gap-2.5',
    };

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="inline-flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
