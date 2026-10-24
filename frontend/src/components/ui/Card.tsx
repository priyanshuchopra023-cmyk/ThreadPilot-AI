import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl border border-secondary-200/80 shadow-card overflow-hidden transition-all duration-200
        ${hover ? 'hover:shadow-card-hover hover:border-secondary-300/90 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}> = ({ children, title, description, className = '', action }) => {
  return (
    <div className={`px-5 py-4 border-b border-secondary-100 flex items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        {title && (
          typeof title === 'string' ? <CardTitle>{title}</CardTitle> : <div className="text-base font-semibold text-secondary-900 tracking-tight">{title}</div>
        )}
        {description && <CardDescription>{description}</CardDescription>}
        {children}
      </div>
      {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <h3 className={`text-base font-semibold text-secondary-900 tracking-tight ${className}`}>{children}</h3>;
};

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <p className={`text-xs text-secondary-500 mt-0.5 ${className}`}>{children}</p>;
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-5 py-3.5 border-t border-secondary-100 bg-secondary-50/50 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

export default Card;
