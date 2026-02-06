'use client';

import React from 'react';
import { X, MessageCircle } from 'lucide-react';

const HighlightedContent = ({
  content,
  highlights = new Map(),
  mentions = [],
  remoteSelections = new Map(), // New prop for other users' selections
  onRemoveHighlight,
  onRemoveMention,
  getUserName
}) => {
  if (!content) return null;

  // If no highlights and no remote selections, just show content
  if ((!highlights || highlights.size === 0) && (!remoteSelections || remoteSelections.size === 0)) {
    return <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{content}</div>;
  }

  const highlightColorMap = {
    yellow: 'bg-yellow-200/60',
    green: 'bg-green-200/60',
    blue: 'bg-blue-200/60',
    pink: 'bg-pink-200/60',
    purple: 'bg-purple-200/60'
  };

  // We need to render the content with overlays. A simple way is to split content by highlights
  // But for multiple overlapping highlights/selections, it's complex.
  // For now, we'll handle non-overlapping or simple cases.

  return (
    <div className="space-y-4">
      <div className="relative prose prose-slate max-w-none">
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>

        {/* Overlays Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* We'll just show markers for now as full text splitting in a stateless component is heavy */}
          {/* Future improvement: Use a library or complex string splitting */}
        </div>
      </div>

      {/* Shared Active Markers (Summary) */}
      <div className="flex flex-wrap gap-2">
        {Array.from(remoteSelections.values()).map((sel) => (
          <div key={sel.userId} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-600 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {getUserName(sel.userId)} is selecting text...
          </div>
        ))}
      </div>

      {/* Highlights List */}
      {highlights.size > 0 && (
        <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageCircle size={12} />
            Annotations ({highlights.size})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
            {Array.from(highlights.values()).map((highlight) => (
              <div
                key={highlight.id}
                className={`p-3 rounded-lg border-l-4 flex items-start justify-between group hover:bg-white transition-all shadow-sm ${highlight.color === 'yellow'
                    ? 'border-yellow-400 bg-yellow-50/30'
                    : highlight.color === 'green'
                      ? 'border-green-400 bg-green-50/30'
                      : highlight.color === 'blue'
                        ? 'border-blue-400 bg-blue-50/30'
                        : 'border-pink-400 bg-pink-50/30'
                  }`}
              >
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 italic">
                    "{highlight.text}"
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      By {getUserName(highlight.createdBy)}
                    </span>
                    {highlight.mentionedUser && (
                      <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                        @{highlight.mentionedUser.name || highlight.mentionedUser}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveHighlight(highlight.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightedContent;
