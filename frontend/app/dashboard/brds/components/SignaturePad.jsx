'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool } from 'lucide-react';

export default function SignaturePad({ onSave, onClear }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Set canvas resolution for better quality
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const { x, y } = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setIsEmpty(false);
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (onSave) {
            onSave(canvasRef.current.toDataURL());
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        if (onClear) onClear();
        if (onSave) onSave(null);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                <span className="flex items-center gap-1.5"><PenTool size={12} /> Sign here</span>
                <button
                    type="button"
                    onClick={clear}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                    <RotateCcw size={12} /> Clear
                </button>
            </div>
            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseOut={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-crosshair group-hover:border-indigo-200 transition-colors touch-none"
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 select-none">
                        <span className="text-xs font-medium text-slate-400">Electronic Signature</span>
                    </div>
                )}
            </div>
        </div>
    );
}
