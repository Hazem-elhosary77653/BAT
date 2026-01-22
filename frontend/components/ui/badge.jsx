import React from 'react';

export const Badge = ({ children, className = '', variant = 'default', ...props }) => {
    const variants = {
        default: 'bg-primary text-white border border-transparent',
        secondary: 'bg-secondary text-white border border-transparent',
        accent: 'bg-accent text-[#0b2b4c] border border-transparent',
        outline: 'border border-gray-200 text-gray-500 bg-transparent',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        destructive: 'bg-rose-50 text-rose-700 border border-rose-100',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold leading-none transition-colors ${variants[variant] || variants.default} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};
