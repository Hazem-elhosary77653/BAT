'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const AIRegeneratePanel = ({ selection, onReplace, onClose }) => {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleRegenerate = async () => {
    if (!instruction.trim()) {
      setError('يرجى إدخال تعليمات للذكاء الاصطناعي');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/brd/regenerate-section', {
        text: selection,
        instruction: instruction,
        tone: 'professional',
        language: 'ar'
      });

      if (response.data?.data?.result) {
        setResult(response.data.data.result);
      } else {
        setError('فشل في الحصول على النتيجة');
      }
    } catch (err) {
      console.error('AI Regenerate Error:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء إعادة التوليد');
    } finally {
      setLoading(false);
    }
  };

  const regenerationSuggestions = [
    '🇸🇦 ترجمه إلى اللغة العربية',
    '✍️ حسّن الأسلوب والصياغة',
    '📝 اجعله أكثر احترافية',
    '🎯 أضف تفاصيل أكثر وضوحاً',
    '💼 اجعله مناسباً للعرض الرسمي'
  ];

  return (
    <div className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-emerald-100 w-96 animate-in zoom-in-95 duration-200" 
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest">
          <Sparkles size={16} />
          إعادة توليد بالذكاء الاصطناعي
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-white rounded-lg"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Selection Preview */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 italic line-clamp-3 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-1">النص المختار:</p>
          "{selection}"
        </div>

        {!result ? (
          <>
            {/* Instructions Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 ml-1">ماذا تريد أن تفعل؟</label>
              <textarea
                ref={inputRef}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="مثال: اجعله أكثر احترافية... أضف تفاصيل... غيّر النبرة..."
                className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleRegenerate();
                  }
                }}
              />
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">اقتراحات سريعة</p>
              <div className="grid grid-cols-2 gap-2">
                {regenerationSuggestions.slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInstruction(suggestion)}
                    className="text-left p-2 text-xs rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors text-slate-700 hover:text-emerald-700 font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleRegenerate}
              disabled={loading || !instruction.trim()}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-bold text-xs shadow-lg shadow-emerald-100 hover:shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  إعادة التوليد
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Result Display */}
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/50 border-2 border-emerald-200 rounded-lg text-sm text-slate-700 max-h-56 overflow-y-auto leading-relaxed">
                {result}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setResult('');
                    setInstruction('');
                    setError('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  جرّب مجدداً
                </button>
                <button
                  onClick={() => onReplace(result)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight size={14} />
                  استخدم النتيجة
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIRegeneratePanel;
