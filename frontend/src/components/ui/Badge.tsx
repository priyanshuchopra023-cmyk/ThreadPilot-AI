import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'primary' | 'brass';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/70',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/70',
    secondary: 'bg-secondary-100 text-secondary-700 border border-secondary-200/80',
    primary: 'bg-navy-50 text-navy-800 border border-navy-200/70',
    brass: 'bg-brass-50 text-brass-800 border border-brass-200/70',
  };

  const dotColorClasses = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    secondary: 'bg-secondary-400',
    primary: 'bg-navy-600',
    brass: 'bg-brass-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-medium leading-none',
    md: 'px-2.5 py-1 text-xs font-medium leading-none',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full tracking-wide select-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${dotColorClasses[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
