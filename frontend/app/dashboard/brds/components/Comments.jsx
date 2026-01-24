'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, CheckCircle, AlertCircle, RefreshCw, ShieldCheck, ChevronRight, User, Filter, MessageCircle } from 'lucide-react';
import api from '@/lib/api';

const Comments = ({ brdId, userPermission, brdContent, user }) => {
  // permission can be a comma-separated string like 'view,comment'
  const perms = (userPermission || '').split(',');
  const canComment = perms.includes('owner') || perms.includes('edit') || perms.includes('comment') || !userPermission;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Permission check for moderation/ownership of a specific comment
  const canModifyComment = (comment) => {
    if (!user) return false;
    const isAuthor = String(comment.user_id) === String(user.id);
    const isModerator = userPermission === 'owner' || userPermission === 'edit';
    return isAuthor || isModerator;
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Extract sections dynamically from brdContent
      let extractedSections = [];
      if (brdContent) {
        // Match headings like # Heading or ## Heading
        const headingMatches = brdContent.match(/^(#{1,2})\s+(.+)$/gm);
        if (headingMatches) {
          extractedSections = headingMatches.map(h => {
            const title = h.replace(/^#{1,2}\s+/, '').trim();
            const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return { section_id: id, section_title: title };
          });
        }
      }

      // Fallback to defaults if no headings found
      if (extractedSections.length === 0) {
        extractedSections = [
          { section_id: 'general', section_title: 'General Feedback' },
          { section_id: 'functional', section_title: 'Functional Requirements' },
          { section_id: 'technical', section_title: 'Technical Stack' }
        ];
      }

      setSections(extractedSections);
      if (!selectedSection || !extractedSections.find(s => s.section_id === selectedSection)) {
        setSelectedSection(extractedSections[0].section_id);
      }

      const commentsResponse = await api.get(`brd/${brdId}/comments`);
      const commentData = Array.isArray(commentsResponse.data)
        ? commentsResponse.data
        : commentsResponse.data?.data || [];
      setComments(commentData);
    } catch (err) {
      console.error('Error fetching data:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to load comments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (brdId) {
      fetchData();
    }
  }, [brdId, brdContent]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedSection || !canComment) return;

    try {
      setSubmitting(true);
      const response = await api.post(`brd/${brdId}/comments`, {
        section_id: selectedSection,
        comment_text: newComment.trim()
      });

      const addedComment = response.data.data || response.data;
      setComments([addedComment, ...comments]);
      setNewComment('');
      setSuccessMessage('Comment added!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding comment:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to add comment';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await api.delete(`brd/${brdId}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const handleResolveComment = async (commentId, isResolved) => {
    try {
      const response = await api.put(`brd/${brdId}/comments/${commentId}`, {
        is_resolved: !isResolved
      });

      const updatedComment = response.data.data || response.data;
      setComments(comments.map(c =>
        c.id === commentId ? updatedComment : c
      ));
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredComments = selectedSection
    ? comments.filter(c => c.section_id === selectedSection)
    : comments;

  const currentSectionTitle = sections.find(s => s.section_id === selectedSection)?.section_title || 'General';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 mt-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs text-slate-400 font-bold uppercase tracking-widest">Loading threads</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Sleek Stats Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{comments.length} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{comments.filter(c => c.status !== 'resolved').length} Open Issues</span>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar - Compact style */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-8 scrollbar-hide overflow-y-auto max-h-[70vh]">
          <div className="flex items-center gap-2 px-1 mb-2 opacity-60">
            <Filter size={12} className="text-slate-500" />
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sections</h4>
          </div>
          <div className="space-y-1">
            {sections.map((section) => {
              const count = comments.filter(c => c.section_id === section.section_id).length;
              const isActive = selectedSection === section.section_id;

              return (
                <button
                  key={section.section_id}
                  onClick={() => setSelectedSection(section.section_id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border-l-2 border-l-transparent'}`}
                >
                  <span className={`text-[12px] font-bold truncate pr-2 ${isActive ? 'text-white' : 'text-slate-500'}`}>{section.section_title}</span>
                  {count > 0 && (
                    <span className={`text-[9px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-black ${isActive ? 'bg-indigo-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Feed Content */}
        <div className="lg:col-span-10 space-y-6">
          {/* Section Header & Add Input */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{currentSectionTitle}</h3>
              </div>
            </div>

            <div className="p-6">
              {canComment ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Add a comment to this section...`}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none min-h-[90px] text-slate-700"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                      {successMessage && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-in fade-in zoom-in">
                          {successMessage}
                        </span>
                      )}
                      <button
                        onClick={handleAddComment}
                        disabled={submitting || !newComment.trim()}
                        className="px-5 py-2 bg-[#0b2b4c] text-white rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-[#1a4a7c] transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-blue-900/10"
                      >
                        {submitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send size={12} />}
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Locked: Read-Only Access</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <div className="py-16 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-100">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No feedback yet</p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`group bg-white border rounded-2xl p-6 transition-all duration-300 ${comment.status === 'resolved' ? 'border-emerald-100 bg-emerald-50/10 opacity-70' : 'border-slate-100 hover:border-slate-300 hover:shadow-md shadow-sm'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${comment.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-900 text-white'}`}>
                        {comment.user_name ? comment.user_name[0].toUpperCase() : <User size={14} />}
                      </div>
                      <div className="space-y-1 pr-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-slate-900">{comment.user_name || 'Member'}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">{formatDate(comment.created_at)}</span>
                          {comment.status === 'resolved' && (
                            <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full tracking-tighter shadow-sm">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className={`text-[14px] leading-relaxed font-medium ${comment.status === 'resolved' ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>

                    {/* Quick Resolve Button - only visible on hover for draft comments if user has permission */}
                    {comment.status !== 'resolved' && canModifyComment(comment) && (
                      <button
                        onClick={() => handleResolveComment(comment.id, false)}
                        className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Resolve Issue"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>

                  {/* Resolved Footer or Delete Button */}
                  {canModifyComment(comment) && (
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4">
                        {comment.status === 'resolved' ? (
                          <button
                            onClick={() => handleResolveComment(comment.id, true)}
                            className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                          >
                            Reopen Discussion
                          </button>
                        ) : null}
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comments;

