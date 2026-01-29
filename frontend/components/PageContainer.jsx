'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import OfflineScreen from '@/components/OfflineScreen';

/**
 * Standard Page Container that handles Sidebar, Header, and Offline states.
 */
export default function PageContainer({
    children,
    isOffline,
    onRetry,
    loading = false,
    loadingComponent = null,
    className = ""
}) {
    if (isOffline) {
        return (
            <div className="flex h-screen bg-[#F8FAFC]">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <OfflineScreen onRetry={onRetry} />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen bg-[#F8FAFC] ${className}`}>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {loading && loadingComponent ? loadingComponent : children}
                </main>
            </div>
        </div>
    );
}
