'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage offline state globally for a page component.
 */
export default function useOffline(onRetryCallback) {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Initial check
        if (typeof window !== 'undefined') {
            setIsOffline(!window.navigator.onLine);

            const handleOnline = () => setIsOffline(false);
            const handleOffline = () => setIsOffline(true);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    const handleRetry = useCallback(() => {
        if (typeof window !== 'undefined' && window.navigator.onLine) {
            setIsOffline(false);
            if (onRetryCallback) onRetryCallback();
        } else {
            setIsOffline(true);
        }
    }, [onRetryCallback]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleOnline = () => {
                setIsOffline(false);
                if (onRetryCallback) onRetryCallback();
            };
            window.addEventListener('online', handleOnline);
            return () => window.removeEventListener('online', handleOnline);
        }
    }, [onRetryCallback]);

    return {
        isOffline,
        setIsOffline,
        handleRetry
    };
}
