'use client';

import React from 'react';
import { RefreshCcw, WifiOff, AlertCircle } from 'lucide-react';

/**
 * A premium Offline/Error screen with a modern 3D illustration and interactive retry logic.
 */
export default function OfflineScreen({
    onRetry,
    title = "Connection Interrupted",
    message = "It looks like you're offline or the server is unreachable. Please check your connection and try again.",
    type = "offline" // "offline" or "error"
}) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500 max-w-lg mx-auto">
            {/* Illustration Container */}
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
                <img
                    src="/api/placeholder/400/400" // Fallback if image not served correctly in dev
                    alt="Connection Interrupted"
                    className="relative z-10 w-64 h-64 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.target.src = 'https://illustrations.popsy.co/white/surreal-cables.svg'; // Use a reliable vector fallback
                    }}
                />

                {/* Floating Icons for extra dynamic feel */}
                <div className="absolute -top-4 -right-4 p-3 bg-white rounded-2xl shadow-xl animate-bounce duration-[3000ms]">
                    <WifiOff className="text-blue-500 w-6 h-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 p-3 bg-white rounded-2xl shadow-xl animate-bounce duration-[4000ms]">
                    <AlertCircle className="text-amber-500 w-6 h-6" />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-[#0b2b4c] tracking-tight">
                    {title}
                </h2>
                <p className="text-slate-500 leading-relaxed font-medium">
                    {message}
                </p>
            </div>

            {/* Action */}
            <div className="mt-10">
                <button
                    onClick={onRetry}
                    className="group relative flex items-center gap-3 px-8 py-4 bg-[#0b2b4c] text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-900/20 hover:bg-[#1a4a7c] active:scale-95 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Try Reconnecting</span>
                </button>

                <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Automatically retrying when connection returns
                </p>
            </div>

            {/* Subtle Design Elements */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl animate-pulse" />
            </div>
        </div>
    );
}
