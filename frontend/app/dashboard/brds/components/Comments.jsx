'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const Comments = ({ brdId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      // Simple section extraction (placeholder sections)
      const extractedSections = [
        { section_id: 'overview', section_title: 'Project Overview' },
        { section_id: 'functional', section_title: 'Functional Requirements' },
        { section_id: 'technical', section_title: 'Technical Stack' }
      ];
      setSections(extractedSections);
      if (!selectedSection) {
        setSelectedSection(extractedSections[0].section_id);
      }

      // Fetch comments
      const commentsResponse = await api.get(`/brd/${brdId}/comments`);
      // Handle both array and wrapped response
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
  }, [brdId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedSection) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/brd/${brdId}/comments`, {
        section_id: selectedSection,
        comment_text: newComment.trim()
      });

      // Add new comment to list
      const addedComment = response.data.data || response.data;
      setComments([addedComment, ...comments]);
      setNewComment('');
      setSuccessMessage('Comment added successfully!');
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
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/brd/${brdId}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      setSuccessMessage('Comment deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting comment:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete comment';
      setError(msg);
    }
  };

  const handleResolveComment = async (commentId, isResolved) => {
    try {
      const response = await api.put(`/brd/${brdId}/comments/${commentId}`, {
        is_resolved: !isResolved
      });

      const updatedComment = response.data.data || response.data;
      setComments(comments.map(c =>
        c.id === commentId ? updatedComment : c
      ));
      setSuccessMessage(
        !isResolved ? 'Comment marked as resolved!' : 'Comment reopened!'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating comment:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update comment';
      setError(msg);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getSectionTitle = (sectionId) => {
    const section = sections.find(s => s.section_id === sectionId);
    return section?.section_title || `Section ${sectionId}`;
  };

  const filteredComments = selectedSection
    ? comments.filter(c => c.section_id === selectedSection)
    : comments;

  const unresolvedCount = comments.filter(c => c.status !== 'resolved').length;
  const resolvedCount = comments.filter(c => c.status === 'resolved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500 dark:text-slate-400">
          <MessageSquare className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-black text-slate-900">Section Discussions</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback, decisions, and resolutions</p>
          </div>
          {successMessage && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-4 h-4" /> {successMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-[11px] uppercase font-black text-slate-500">Total</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{comments.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
            <p className="text-[11px] uppercase font-black text-amber-600">Unresolved</p>
            <p className="text-2xl font-black text-amber-800 mt-1">{unresolvedCount}</p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
            <p className="text-[11px] uppercase font-black text-emerald-600">Resolved</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Section selector + composer */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          {sections.length > 1 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Sections</p>
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <button
                    key={section.section_id}
                    onClick={() => { setSelectedSection(section.section_id); setNewComment(''); }}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedSection === section.section_id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200'}
                    `}
                  >
                    {section.section_title.length > 18 ? `${section.section_title.slice(0, 18)}…` : section.section_title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Add Comment</p>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share feedback for this section..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-indigo-100 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 disabled:opacity-60"
              >
                <Send className="w-4 h-4" /> {submitting ? 'Posting...' : 'Post' }
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {filteredComments.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center bg-white">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700">No comments on {selectedSection ? getSectionTitle(selectedSection) : 'this section'} yet</p>
              <p className="text-sm text-slate-500 mt-1">Be the first to share feedback.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-2xl border p-5 bg-white transition-all ${comment.status === 'resolved' ? 'border-emerald-200 shadow-none opacity-90' : 'border-slate-200 shadow-sm hover:shadow-md'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center font-bold">
                        {comment.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{comment.user_name || 'Unknown User'}</p>
                        <p className="text-xs text-slate-500">{formatDate(comment.created_at)}</p>
                      </div>
                    </div>
                    {comment.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <CheckCircle className="w-4 h-4" /> Resolved
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 mt-3 leading-relaxed">{comment.comment_text}</p>

                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleResolveComment(comment.id, comment.status === 'resolved')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {comment.status === 'resolved' ? 'Reopen' : 'Mark as Resolved'}
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
