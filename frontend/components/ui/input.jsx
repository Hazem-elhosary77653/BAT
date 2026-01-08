import React from 'react';

export const Input = React.forwardRef(({ className = '', type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={`w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-[var(--color-text)] placeholder-[var(--color-text-muted)] ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
