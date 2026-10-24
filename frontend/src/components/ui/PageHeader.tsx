import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) => {
  const headerDescription = subtitle || description;
  return (
    <div className={`mb-6 pb-4 border-b border-secondary-200/60 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-secondary-500">
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-secondary-400">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-secondary-800 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-secondary-700 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
              {title}
            </h1>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>
          {headerDescription && (
            <p className="text-xs sm:text-sm text-secondary-500 mt-1 max-w-2xl">
              {headerDescription}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
