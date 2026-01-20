import React from 'react';
import { Loader2 } from 'lucide-react';

// Unified Spinner component
export const Spinner = ({ size = 24, className = '' }) => (
    <Loader2
        size={size}
        className={`animate-spin text-[var(--color-primary)] ${className}`}
    />
);

// Full-page or container loading overlay
export const LoadingOverlay = ({ message = 'Loading...', fullPage = true }) => (
    <div className={`${fullPage ? 'fixed inset-0' : 'absolute inset-0'} bg-white/80 backdrop-blur-sm flex items-center justify-center z-50`}>
        <div className="text-center">
            <Spinner size={48} className="mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)] font-medium">{message}</p>
        </div>
    </div>
);

// Card-style loading placeholder
export const LoadingCard = ({ message = 'Loading...', height = 'h-48' }) => (
    <div className={`flex items-center justify-center ${height} bg-white rounded-xl border border-[var(--color-border)]`}>
        <div className="text-center">
            <Spinner size={40} className="mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)] font-medium">{message}</p>
        </div>
    </div>
);

export default {
    Spinner,
    LoadingOverlay,
    LoadingCard
};
