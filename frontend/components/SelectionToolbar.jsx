'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Highlighter,
  MessageCircle,
  Sparkles,
  Copy,
  Share2,
  X
} from 'lucide-react';

const SelectionToolbar = ({
  selection,
  position,
  onHighlight,
  onMention,
  onAIRegenerate,
  onClose,
  activeUsers = []
}) => {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const toolbarRef = useRef(null);

  const highlightColors = [
    { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-300' },
    { name: 'green', bg: 'bg-green-200', border: 'border-green-300' },
    { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-300' },
    { name: 'pink', bg: 'bg-pink-200', border: 'border-pink-300' },
    { name: 'purple', bg: 'bg-purple-200', border: 'border-purple-300' }
  ];

  // إغلاق الـ dropdown عند الضغط خارجه
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selection || !position) return null;

  return (
    <div
      ref={toolbarRef}
      className="selection-toolbar fixed z-[99999] bg-white rounded-2xl shadow-2xl border-2 border-indigo-400 p-3 animate-in zoom-in-95 duration-200 flex items-center gap-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)'
      }}
    >
      {/* Highlight Button with Color Picker */}
      <div className="relative group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHighlight(highlightColor);
          }}
          className={`p-2 rounded-lg transition-all hover:bg-yellow-50 border-2 border-yellow-300 flex items-center gap-1.5 text-xs font-bold text-yellow-700 hover:scale-105`}
          title="أضف تلوين"
        >
          <Highlighter size={16} />
        </button>
        {/* Color Picker */}
        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border-2 border-slate-300 p-2 hidden group-hover:flex gap-1.5 flex-row z-[100000]">
          {highlightColors.map(color => (
            <button
              key={color.name}
              onClick={(e) => {
                e.stopPropagation();
                setHighlightColor(color.name);
                onHighlight(color.name);
              }}
              className={`w-7 h-7 rounded-full border-2 ${color.bg} ${color.border} hover:ring-2 ring-slate-400 transition-all hover:scale-110`}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Mention Button */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMentionDropdown(!showMentionDropdown);
          }}
          className="p-2 rounded-lg transition-all hover:bg-indigo-50 border-2 border-indigo-300 flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:scale-105"
          title="أشر إلى مستخدم"
        >
          <MessageCircle size={16} />
        </button>

        {/* Mention Dropdown */}
        {showMentionDropdown && (
          <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border-2 border-slate-300 min-w-[200px] p-2 z-[100000]">
            {activeUsers && activeUsers.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {activeUsers.map((userId, idx) => (
                  <button
                    key={userId || idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMention(userId);
                      setShowMentionDropdown(false);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-indigo-50 transition-colors text-xs flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-medium text-slate-700">{userId || 'User'}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                لا يوجد مستخدمون متاحون
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Regenerate Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAIRegenerate();
        }}
        className="p-2 rounded-lg transition-all hover:bg-emerald-50 border-2 border-emerald-300 flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:scale-105"
        title="أعد توليد باستخدام الذكاء الاصطناعي"
      >
        <Sparkles size={16} />
      </button>

      {/* Copy Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(selection);
          alert('تم النسخ! ✅');
        }}
        className="p-2 rounded-lg transition-all hover:bg-slate-100 border-2 border-slate-300 flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:scale-105"
        title="انسخ النص"
      >
        <Copy size={16} />
      </button>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-2 rounded-lg transition-all hover:bg-red-50 border-2 border-red-300 flex items-center gap-1.5 text-xs font-bold text-red-600 ml-1 hover:scale-105"
        title="إغلق"
      >
        <X size={16} />
      </button>

      {/* Arrow Pointer */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200 rounded-br-sm transform rotate-45 -mt-1.5"
      />
    </div>
  );
};

export default SelectionToolbar;
