import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl
        border border-dashed border-secondary-200/90 bg-white/60 ${className}
      `}
    >
      <div className="relative mb-4">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-blue-100/50 rounded-2xl blur-md" />
        
        {/* Decorative thread icon container */}
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-50 to-blue-50 border border-secondary-200 flex items-center justify-center text-navy-800 shadow-xs">
          {icon || (
            <svg
              className="w-7 h-7 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <path d="M6 14h6" />
              <circle cx="18" cy="18" r="3" className="fill-brass-400 stroke-brass-600" />
            </svg>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold text-navy-900 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-secondary-500 max-w-sm mb-5">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
