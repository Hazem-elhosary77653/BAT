'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  ArrowRight,
  Users,
  Check,
  MoreHorizontal
} from 'lucide-react';
import api from '@/lib/api';
import SignaturePad from './SignaturePad';

export default function WorkflowPanel({ brdId, currentStatus, assignedTo, userId, ownerId, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [reason, setReason] = useState('');
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [signature, setSignature] = useState(null);
  const [showReassign, setShowReassign] = useState(false);
  const [assignments, setAssignments] = useState([]);

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusMeta = (fromStatus, toStatus) => {
    const normalizedTo = (toStatus || '').toLowerCase();
    if (normalizedTo === 'approved') return { label: 'Approved', badge: 'bg-emerald-100 text-emerald-700' };
    if (normalizedTo === 'in-review' || normalizedTo === 'review') return { label: 'In Review', badge: 'bg-amber-100 text-amber-700' };
    if (normalizedTo === 'draft' && (fromStatus || '').toLowerCase() === 'in-review') return { label: 'Rejected', badge: 'bg-rose-100 text-rose-700' };
    return { label: 'Draft', badge: 'bg-slate-100 text-slate-700' };
  };

  // Normalize statuses
  const normalizedStatus = currentStatus === 'review' ? 'in-review' : currentStatus;
  const isDraft = normalizedStatus === 'draft';
  const isInReview = normalizedStatus === 'in-review';
  const isApproved = normalizedStatus === 'approved';
  const isOwner = String(userId) === String(ownerId);

  // Fetch data
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const response = await api.get('/users/reviewers');
        setReviewers(response.data.data || []);
      } catch (err) {
        setReviewers([]);
      }
    };
    fetchReviewers();
    fetchWorkflowHistory();
    fetchAssignments();
  }, [brdId]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/brd/${brdId}/review-assignments`);
      setAssignments(response.data.data || []);
    } catch (err) { console.error('Error fetching assignments', err); }
  };

  const fetchWorkflowHistory = async () => {
    try {
      const response = await api.get(`/brd/${brdId}/workflow-history`);
      setWorkflowHistory(response.data.data || []);
    } catch (err) { console.error('Error fetching history', err); }
  };

  // Determine if current user is an active reviewer
  const userAssignment = assignments.find(a => String(a.assigned_to) === String(userId) && a.status === 'pending');
  const isAssignedReviewer = !!userAssignment && isInReview;

  const toggleReviewerSelection = (id) => {
    setSelectedReviewers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRequestReview = async () => {
    if (selectedReviewers.length === 0) {
      setError('Please select at least one reviewer');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/brd/${brdId}/request-review`, {
        assigned_to: selectedReviewers,
        reason: reason || undefined,
        signature: signature || undefined,
      });
      onStatusChange('in-review');
      setSelectedReviewers([]);
      setReason('');
      setShowReviewerDropdown(false);
      fetchAssignments();
      fetchWorkflowHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request review');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    // Re-assign currently supports single assignment override in backend API,
    // but effectively we might want to just "Request Review" again to restart?
    // The previous implementation of re-assign replaces ONE reviewer.
    // For now, let's keep re-assign simple (pick ONE) OR hide it if multiple approvers handling is robust.
    // Actually, let's just use the single selection for re-assign to avoid complexity mismatch with backend.
    if (selectedReviewers.length !== 1) {
      setError('Please select exactly one new reviewer for re-assignment');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/brd/${brdId}/reassign`, {
        assigned_to: selectedReviewers[0],
        reason: reason || undefined,
      });
      onStatusChange('in-review');
      setSelectedReviewers([]);
      setReason('');
      setShowReassign(false);
      setShowReviewerDropdown(false);
      fetchAssignments();
      fetchWorkflowHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to re-assign review');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/brd/${brdId}/approve`, {
        reason: reason || undefined,
        signature: signature || undefined,
      });
      // We don't auto-set approved status here because it depends on fetchAssignments consensus
      // But we can trigger a refresh
      fetchAssignments();
      fetchWorkflowHistory();
      setReason('');
      // If that was the last approval, parent will eventually get update via polling or manual refresh?
      // Ideally we check response data.status
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/brd/${brdId}/reject`, { reason: reason || undefined });
      onStatusChange('draft');
      setReason('');
      fetchAssignments();
      fetchWorkflowHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${isApproved ? 'bg-emerald-100 text-emerald-700' :
              isInReview ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}>
              {isApproved ? <CheckCircle size={14} /> : isInReview ? <Clock size={14} /> : <AlertCircle size={14} />}
              {isApproved ? 'Approved' : isInReview ? 'In Review' : 'Draft'}
            </div>
            {isOwner && <span className="text-[10px] font-bold text-slate-400 uppercase">Owner</span>}
          </div>
        </div>

        {/* Detailed Assignments List */}
        {isInReview && assignments.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Reviewers</p>
            {assignments.filter(a => a.status !== 'cancelled').map(assign => (
              <div key={assign.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${assign.status === 'approved' ? 'bg-emerald-500' : assign.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <span className="text-slate-700 font-medium">
                    {assign.assigned_to_first_name ? `${assign.assigned_to_first_name} ${assign.assigned_to_last_name}` : assign.assigned_to_email || `#${assign.assigned_to}`}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${assign.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : assign.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {assign.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Draft: Send for Review (with Multi-Select) */}
      {isDraft && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Send size={16} className="text-indigo-500" />
            Send for Review
          </div>

          <div className="relative">
            <button
              onClick={() => setShowReviewerDropdown(!showReviewerDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 bg-white rounded-lg hover:border-slate-300 text-sm text-slate-700"
            >
              <span>
                {selectedReviewers.length === 0
                  ? 'Select reviewers...'
                  : `${selectedReviewers.length} selected`}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showReviewerDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showReviewerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto">
                {reviewers.map((reviewer) => {
                  const isSelected = selectedReviewers.includes(reviewer.id);
                  return (
                    <button
                      key={reviewer.id}
                      onClick={() => toggleReviewerSelection(reviewer.id)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-indigo-50 text-sm border-b border-slate-100 last:border-0 flex items-center justify-between ${isSelected ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div>
                        <div className="font-medium text-slate-800">{reviewer.first_name} {reviewer.last_name}</div>
                        <div className="text-xs text-slate-500">{reviewer.email}</div>
                      </div>
                      {isSelected && <Check size={16} className="text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedReviewers.map(id => {
              const r = reviewers.find(x => x.id === id);
              if (!r) return null;
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                  {r.first_name} {r.last_name}
                  <button onClick={() => toggleReviewerSelection(id)} className="hover:text-indigo-900"><div className="w-3 h-3 rounded-full bg-indigo-200 flex items-center justify-center">×</div></button>
                </span>
              );
            })}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a message (optional)..."
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows="2"
          />

          <SignaturePad onSave={setSignature} />

          <button
            onClick={handleRequestReview}
            disabled={loading || selectedReviewers.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Request Review'}
          </button>
        </div>
      )}

      {/* In Review: Reviewer Actions */}
      {isAssignedReviewer && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Clock size={16} />
            Waiting for your decision
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add feedback (optional)..."
            className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white"
            rows="2"
          />

          <SignaturePad onSave={setSignature} />

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {loading ? '...' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <XCircle size={16} />
              {loading ? '...' : 'Reject'}
            </button>
          </div>
        </div>
      )}

      {/* In Review: Waiting Message (for non-reviewers) */}
      {isInReview && !isAssignedReviewer && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-3">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-amber-600" />
            <p className="text-sm text-amber-800">Waiting for reviewers</p>
          </div>

          {/* Re-assign Option for Owner */}
          {isOwner && (
            <div className="mt-2 pt-3 border-t border-amber-200/60">
              {!showReassign ? (
                <button
                  onClick={() => setShowReassign(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                >
                  <Users size={14} />
                  Re-assign to someone else?
                </button>
              ) : (
                <div className="bg-white/80 p-3 rounded-lg border border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Re-assign Review</span>
                    <button onClick={() => setShowReassign(false)} className="text-slate-400 hover:text-slate-600">
                      <XCircle size={14} />
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowReviewerDropdown(!showReviewerDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 bg-white rounded-lg hover:border-slate-300 text-xs text-slate-700"
                    >
                      <span>
                        {selectedReviewers.length === 1
                          ? (() => {
                            const r = reviewers.find(x => x.id === selectedReviewers[0]);
                            return r ? `${r.first_name} ${r.last_name}` : 'Selected';
                          })()
                          : 'Select new reviewer...'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showReviewerDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showReviewerDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                        {reviewers.map((reviewer) => (
                          <button
                            key={reviewer.id}
                            onClick={() => { setSelectedReviewers([reviewer.id]); setShowReviewerDropdown(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-xs border-b border-slate-100 last:border-0"
                          >
                            <div className="font-medium text-slate-800">{reviewer.first_name} {reviewer.last_name}</div>
                            <div className="text-[10px] text-slate-500">{reviewer.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for re-assignment..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                    rows="2"
                  />

                  <button
                    onClick={handleReassign}
                    disabled={loading || selectedReviewers.length !== 1}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Confirm Re-assignment'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approved Message */}
      {isApproved && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Document Approved</p>
            <p className="text-xs text-emerald-600">Ready for use</p>
          </div>
        </div>
      )}

      {/* Workflow History - Collapsible */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) fetchWorkflowHistory();
          }}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-sm"
        >
          <div className="flex items-center gap-2 text-slate-700">
            <History size={16} />
            <span className="font-medium">History</span>
            <span className="text-xs text-slate-400">({workflowHistory.length})</span>
          </div>
          <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? '' : 'rotate-180'}`} />
        </button>

        {showHistory && (
          <div className="border-t border-slate-100 px-3 py-2 space-y-2 max-h-56 overflow-y-auto">
            {workflowHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No history yet</p>
            ) : (
              workflowHistory.map((event, idx) => {
                const actor = event.first_name || event.last_name ? `${event.first_name || ''} ${event.last_name || ''}`.trim() : event.email || 'System';
                const { label, badge } = getStatusMeta(event.from_status, event.to_status);
                return (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <ArrowRight size={12} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-700 capitalize truncate">
                          {`${event.from_status || 'Created'} -> ${event.to_status || ''}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge}`}>{label}</span>
                        <span className="text-slate-400 whitespace-nowrap">{formatDateTime(event.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-[11px] font-medium">{actor}</span>
                      </div>
                      {event.reason && (
                        <p className="text-slate-600 mt-0.5 text-[11px] leading-snug break-words font-medium italic">"{event.reason}"</p>
                      )}

                      {event.signature && (
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg inline-block">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">Electronic Signature</p>
                          <img src={event.signature} alt="Signature" className="h-12 w-auto object-contain bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
