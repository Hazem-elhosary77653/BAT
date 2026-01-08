import React from 'react';

export const Alert = ({ children, className = '', variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-blue-50 border border-blue-200 rounded-lg p-4',
    destructive: 'bg-red-50 border border-red-200 rounded-lg p-4',
    success: 'bg-green-50 border border-green-200 rounded-lg p-4',
    warning: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4',
  };

  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '', ...props }) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertTitle = ({ children, className = '', ...props }) => {
  return (
    <h5 className={`font-semibold mb-2 ${className}`} {...props}>
      {children}
    </h5>
  );
};
