'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import useTextSelection from '@/hooks/useTextSelection';
import useCollaboration from '@/hooks/useCollaboration';
import SelectionToolbar from './SelectionToolbar';
import AIRegeneratePanel from './AIRegeneratePanel';
import HighlightedContent from './HighlightedContent';
import api from '@/lib/api';

const CollaborativeTextEditor = ({
  brdId,
  userId,
  userName,
  content,
  onContentChange,
  section
}) => {
  const contentRef = useRef(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [updatedContent, setUpdatedContent] = useState(content);

  // استخدام hooks الكولابريشن والتحديد
  const {
    selection,
    toolbarPosition,
    highlights,
    mentions,
    addHighlight,
    removeHighlight,
    addMention,
    closeToolbar
  } = useTextSelection(contentRef, userId);

  const {
    isConnected,
    activeUsers,
    highlights: sharedHighlights,
    userSelections,
    remoteChange,
    broadcastHighlight,
    removeHighlightBroadcast,
    broadcastSelection,
    sendContentChange,
    getUserName
  } = useCollaboration(brdId, userId, userName);

  // تحديث المحتوى عند استقبال تغييرات من مستخدمين آخرين
  useEffect(() => {
    if (remoteChange && remoteChange.sectionId === section?.id && remoteChange.userId !== userId) {
      setUpdatedContent(remoteChange.change);
      onContentChange(remoteChange.change);
    }
  }, [remoteChange, section?.id, userId, onContentChange]);

  // معالج تغيير المحتوى (كتحرير مباشر)
  const handleLocalContentChange = useCallback((newContent) => {
    setUpdatedContent(newContent);
    onContentChange(newContent);

    // إرسال التغيير بالـ WebSocket
    if (section?.id) {
      sendContentChange(section.id, newContent);
    }
  }, [section?.id, onContentChange, sendContentChange]);

  // معالج تحديد النص
  const handleTextSelection = useCallback(() => {
    const selectedText = window.getSelection();
    if (selectedText.toString().length > 0) {
      broadcastSelection({
        text: selectedText.toString(),
        startOffset: 0,
        endOffset: selectedText.toString().length
      });
    } else {
      broadcastSelection(null);
    }
  }, [broadcastSelection]);

  // معالج الهايلايت
  const handleHighlight = useCallback((color) => {
    if (selection) {
      addHighlight(selection, color);
      broadcastHighlight(selection, color);
      closeToolbar();
    }
  }, [selection, addHighlight, broadcastHighlight, closeToolbar]);

  // معالج الـ Mention
  const handleMention = useCallback((user) => {
    if (selection) {
      addMention(selection, user);
      broadcastHighlight(selection, 'yellow', user);
      closeToolbar();
    }
  }, [selection, addMention, broadcastHighlight, closeToolbar]);

  // معالج إعادة التوليد بالذكاء الاصطناعي
  const handleAIRegenerate = useCallback(() => {
    if (selection) {
      setShowAIPanel(true);
    }
  }, [selection]);

  // معالج استبدال النص
  const handleReplaceText = useCallback((newText) => {
    const newContent = updatedContent.replace(selection, newText);
    handleLocalContentChange(newContent);
    setShowAIPanel(false);

    // تحديث قاعدة البيانات (Persist)
    if (section?.id) {
      api.post(`/brd/${brdId}/section/${section.id}/content`, {
        content: newContent
      }).catch(err => console.error('Error updating section:', err));
    }
  }, [selection, updatedContent, brdId, section, handleLocalContentChange]);

  return (
    <div className="relative w-full">
      {/* محتوى قابل للتحرير أو العرض مع هايلايتات */}
      <div
        ref={contentRef}
        className="collaborative-content prose prose-slate max-w-none p-6 bg-white rounded-xl border border-slate-200 cursor-text hover:border-indigo-300 transition-colors shadow-sm min-h-[200px] outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => handleLocalContentChange(e.currentTarget.innerText)}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <div contentEditable={false}>
          <HighlightedContent
            content={updatedContent}
            highlights={new Map([
              ...highlights,
              ...Array.from(sharedHighlights.values()).map(h => [h.id, h])
            ])}
            mentions={mentions}
            remoteSelections={userSelections}
            onRemoveHighlight={removeHighlight}
            onRemoveMention={(id) => {
              removeHighlightBroadcast(id);
            }}
            getUserName={getUserName}
          />
        </div>
      </div>

      {/* Toolbar الذي يظهر عند التحديد */}
      <SelectionToolbar
        selection={selection}
        position={toolbarPosition}
        onHighlight={handleHighlight}
        onMention={handleMention}
        onAIRegenerate={handleAIRegenerate}
        onClose={closeToolbar}
        activeUsers={activeUsers}
      />

      {/* لوحة إعادة التوليد بالذكاء الاصطناعي */}
      {showAIPanel && (
        <AIRegeneratePanel
          selection={selection}
          onReplace={handleReplaceText}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* مؤشر الاتصال */}
      {isConnected && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          متصل والتعاون نشط
        </div>
      )}

      {/* شريط معلومات الهايلايتات */}
      {(highlights.size > 0 || sharedHighlights.size > 0) && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700">
          📌 عدد التعليقات والتوضيحات: {highlights.size + sharedHighlights.size}
        </div>
      )}
    </div>
  );
};

export default CollaborativeTextEditor;
