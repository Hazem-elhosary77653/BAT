import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-[var(--color-surface)] rounded-xl shadow-soft border border-[var(--color-border)] hover:shadow-card transition-all ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-b border-[var(--color-border)] p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h2 className={`text-2xl font-bold text-[var(--color-text)] ${className}`} {...props}>
      {children}
    </h2>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-[var(--color-text-muted)] mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-t border-[var(--color-border)] p-6 flex justify-end gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
