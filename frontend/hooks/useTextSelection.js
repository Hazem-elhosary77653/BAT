/**
 * useTextSelection Hook
 * يدير تحديد النص وظهور الـ toolbar والهايلايت
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useTextSelection = (contentRef, userId) => {
  const [selection, setSelection] = useState(null);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [highlights, setHighlights] = useState(new Map());
  const [mentions, setMentions] = useState([]);
  const selectionRef = useRef(null);

  // معالجة تحديد النص
  const handleTextSelection = useCallback(() => {
    const selectedText = window.getSelection();

    if (selectedText.toString().length > 0) {
      const range = selectedText.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText.toString(),
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        commonAncestorContainer: range.commonAncestorContainer
      });

      setToolbarPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX + rect.width / 2
      });
    } else {
      setSelection(null);
      setToolbarPosition(null);
    }
  }, []);

  // إضافة event listeners
  useEffect(() => {
    if (!contentRef?.current) return;

    const container = contentRef.current;

    container.addEventListener('mouseup', handleTextSelection);
    container.addEventListener('touchend', handleTextSelection);

    return () => {
      container.removeEventListener('mouseup', handleTextSelection);
      container.removeEventListener('touchend', handleTextSelection);
    };
  }, [contentRef, handleTextSelection]);

  // دالة إضافة هايلايت
  const addHighlight = useCallback((text, color = 'yellow', mentionedUser = null) => {
    const highlightId = `hl-${Date.now()}-${Math.random()}`;

    setHighlights(prev => {
      const updated = new Map(prev);
      updated.set(highlightId, {
        id: highlightId,
        text,
        color,
        createdBy: userId,
        createdAt: new Date(),
        mentionedUser,
        status: 'active'
      });
      return updated;
    });

    return highlightId;
  }, [userId]);

  // دالة إزالة هايلايت
  const removeHighlight = useCallback((highlightId) => {
    setHighlights(prev => {
      const updated = new Map(prev);
      updated.delete(highlightId);
      return updated;
    });
  }, []);

  // دالة إضافة mention
  const addMention = useCallback((text, mentionedUser) => {
    const mentionId = `mention-${Date.now()}`;

    setMentions(prev => [
      ...prev,
      {
        id: mentionId,
        text,
        mentionedUser,
        mentionedBy: userId,
        createdAt: new Date(),
        read: false
      }
    ]);

    return mentionId;
  }, [userId]);

  // دالة تحديث حالة الـ mention
  const markMentionAsRead = useCallback((mentionId) => {
    setMentions(prev =>
      prev.map(m => m.id === mentionId ? { ...m, read: true } : m)
    );
  }, []);

  // إغلاق الـ toolbar
  const closeToolbar = useCallback(() => {
    setSelection(null);
    setToolbarPosition(null);
    window.getSelection().removeAllRanges();
  }, []);

  return {
    selection: selection?.text,
    toolbarPosition,
    highlights,
    mentions,
    addHighlight,
    removeHighlight,
    addMention,
    markMentionAsRead,
    closeToolbar,
    selectionData: selection
  };
};

export default useTextSelection;
