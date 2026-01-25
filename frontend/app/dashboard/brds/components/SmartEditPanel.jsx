import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function SmartEditPanel({ selection, onReplace, onClose }) {
    const [instruction, setInstruction] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleSmartEdit = async () => {
        if (!instruction.trim()) return;
        setLoading(true);
        try {
            const response = await api.post('/brd/smart-edit', {
                selection,
                instruction
            });
            setResult(response.data?.data?.rewritten || '');
        } catch (err) {
            console.error('Smart edit failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute z-50 bg-white rounded-xl shadow-2xl border border-indigo-100 w-96 animate-in zoom-in-95 duration-200" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={14} /> AI Smart Edit
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Selection Preview */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 italic line-clamp-3">
                    "{selection}"
                </div>

                {!result ? (
                    /* Input Mode */
                    <div className="space-y-3">
                        <textarea
                            ref={inputRef}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="e.g., Make this more professional, Fix grammar, Add details about..."
                            className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSmartEdit();
                                }
                            }}
                        />
                        <button
                            onClick={handleSmartEdit}
                            disabled={loading || !instruction.trim()}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Generate Improvement
                        </button>
                    </div>
                ) : (
                    /* Result Mode */
                    <div className="space-y-3">
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm text-slate-700 max-h-48 overflow-y-auto">
                            {result}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setResult('')}
                                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => onReplace(result)}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowRight size={14} />
                                Replace Text
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
