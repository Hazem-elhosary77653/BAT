/**
 * Discussion Threads Component
 * يعرض خيوط النقاش والتعليقات
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import useCollaboration from '@/hooks/useCollaboration';
import MentionInput from './MentionInput';

const DiscussionThreads = ({ brdId, sectionId, userId, userName }) => {
  const {
    threads,
    createThread,
    replyToThread,
    resolveThread,
    mentionUser
  } = useCollaboration(brdId, userId, userName);

  const [threads_list, setThreadsList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [threadType, setThreadType] = useState('general');
  const inputRef = useRef(null);

  // تصفية الخيوط حسب القسم
  useEffect(() => {
    if (!threads || typeof threads.values !== 'function') {
      setThreadsList([]);
      return;
    }
    
    const sectionThreads = Array.from(threads.values())
      .filter(t => t.sectionId === sectionId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    setThreadsList(sectionThreads);
  }, [threads, sectionId]);

  const handleCreateThread = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    const success = createThread(sectionId, newComment, threadType);
    
    if (success) {
      setNewComment('');
      setShowNewThread(false);
      setThreadType('general');
    }
  };

  const handleReply = (threadId) => {
    if (!newComment.trim()) return;

    const success = replyToThread(sectionId, threadId, newComment);
    
    if (success) {
      setNewComment('');
      setSelectedThreadId(null);
    }
  };

  const handleResolve = (threadId) => {
    const success = resolveThread(sectionId, threadId);
    
    if (success) {
      // تحديث الخيط المحلي
      setThreadsList(prev =>
        prev.map(t =>
          t.id === threadId ? { ...t, status: 'resolved' } : t
        )
      );
    }
  };

  // استخراج @mentions من النص
  const extractMentions = (text) => {
    const regex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  };

  return (
    <div className="discussion-threads bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-800">Discussion threads</h2>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-semibold"
        >
          New thread
        </button>
      </div>

      {/* نموذج خيط جديد */}
      {showNewThread && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <form onSubmit={handleCreateThread}>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Thread type</label>
              <select
                value={threadType}
                onChange={(e) => setThreadType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="general">General</option>
                <option value="question">Question</option>
                <option value="suggestion">Suggestion</option>
                <option value="bug">Bug</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                placeholder="Write your message... (type @ to mention)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs resize-none"
                onMention={(user) => {
                  // إشعار المستخدم المذكور
                  mentionUser(user.id, {
                    sectionId,
                    sectionName: `Discussion Thread`,
                    context: newComment
                  });
                }}
              />
              <p className="text-[10px] text-slate-500 mt-1">Tip: use @ to mention a teammate.</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${newComment.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewThread(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* قائمة الخيوط */}
      <div className="space-y-4">
        {threads_list.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No threads yet</p>
            <p className="text-xs mt-1">Start a new discussion using “New thread”.</p>
          </div>
        ) : (
          threads_list.map((thread) => (
            <div
              key={thread.id}
              className="border border-slate-200 rounded-lg overflow-hidden bg-white"
            >
              {/* رأس الخيط */}
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {thread.comments?.[0]?.content?.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        by {thread.comments?.[0]?.userId} •{' '}
                        {new Date(thread.comments?.[0]?.timestamp).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      thread.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : thread.status === 'open'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {thread.status === 'resolved'
                        ? 'Resolved'
                        : thread.status === 'open'
                        ? 'Open'
                        : 'Pending'}
                    </span>

                    {thread.status !== 'resolved' && userId === thread.comments?.[0]?.userId && (
                      <button
                        onClick={() => handleResolve(thread.id)}
                        className="text-[10px] px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                        title="Resolve thread"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* التعليقات */}
              <div className="space-y-3 p-4 bg-white">
                {thread.comments?.map((comment, index) => (
                  <div key={index} className="pl-4 border-l-2 border-slate-200">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">{comment.userId}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(comment.timestamp).toLocaleTimeString('en-US')}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 break-words">{comment.content}</p>

                    {/* Reactions */}
                    {comment.reactions?.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        {comment.reactions.map((reaction, i) => (
                          <span key={i} className="bg-slate-100 px-2 py-1 rounded">
                            {reaction.emoji} {reaction.count || 1}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* نموذج الرد */}
              {thread.status !== 'resolved' && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  {selectedThreadId === thread.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleReply(thread.id);
                      }}
                    >
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${newComment.trim()
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedThreadId(null);
                            setNewComment('');
                          }}
                          className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setSelectedThreadId(thread.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Reply to thread
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* إحصائيات */}
      <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-[11px] text-slate-500">Total</p>
          <p className="text-xl font-bold text-slate-800">{threads_list.length}</p>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <p className="text-[11px] text-emerald-700">Resolved</p>
          <p className="text-xl font-bold text-emerald-700">
            {threads_list.filter(t => t.status === 'resolved').length}
          </p>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <p className="text-[11px] text-indigo-700">Open</p>
          <p className="text-xl font-bold text-indigo-700">
            {threads_list.filter(t => t.status === 'open').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscussionThreads;
