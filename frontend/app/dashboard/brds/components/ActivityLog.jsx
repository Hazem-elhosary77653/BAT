'use client';

import { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, AlertCircle, XCircle, Edit, MessageSquare, UserPlus } from 'lucide-react';
import api from '@/lib/api';

const ActivityLog = ({ brdId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivityLog = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get(`brd/${brdId}/activity-log`);
      // Handle both array and wrapped response
      const activityData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setActivities(activityData);
    } catch (err) {
      console.error('Error fetching activity log:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch activity log';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (brdId) {
      fetchActivityLog();
    }
  }, [brdId]);

  const getStatusIcon = (status) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('APPROV')) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (s.includes('REJECT')) return <XCircle className="w-5 h-5 text-red-500" />;
    if (s.includes('REVIEW_REQUEST')) return <AlertCircle className="w-5 h-5 text-amber-500" />;
    if (s.includes('UPDATED')) return <Edit className="w-5 h-5 text-indigo-500" />;
    if (s.includes('COMMENT')) return <MessageSquare className="w-5 h-5 text-sky-500" />;
    if (s.includes('COLLABORATOR')) return <UserPlus className="w-5 h-5 text-violet-500" />;
    return <Clock className="w-5 h-5 text-slate-400" />;
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('APPROVED')) return 'border-emerald-200 bg-emerald-50';
    if (s.includes('REJECTED')) return 'border-rose-200 bg-rose-50';
    if (s.includes('REVIEW_REQUESTED')) return 'border-amber-200 bg-amber-50';
    if (s.includes('UPDATED')) return 'border-indigo-200 bg-indigo-50/30';
    if (s.includes('COMMENT')) return 'border-sky-200 bg-sky-50/30';
    if (s.includes('COLLABORATOR')) return 'border-violet-200 bg-violet-50/30';
    return 'border-slate-200 bg-slate-50';
  };

  const getStatusLabel = (status) => {
    return status
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Updated';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500 dark:text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading activity log...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <button onClick={fetchActivityLog} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
        <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No activity yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          Activity will appear here as the document is reviewed and updated
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900">Activity Timeline</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow changes & reviewer actions</p>
        </div>
        <div className="text-xs text-slate-500 font-semibold px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
          {activities.length} events
        </div>
      </div>

      <div className="relative space-y-6">
        {activities.map((activity, index) => (
          <div key={activity.id || index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                {getStatusIcon(activity.to_status)}
              </div>
              {index < activities.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-200 to-slate-100" />}
            </div>

            <div className="flex-1">
              <div className={`rounded-2xl border p-5 bg-white shadow-sm ${getStatusColor(activity.to_status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{getStatusLabel(activity.to_status)}</span>
                    {activity.from_status && (
                      <span className="text-xs text-slate-500">from {getStatusLabel(activity.from_status)}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                    {activity.user_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-semibold text-slate-800">{activity.user_name || 'Unknown User'}</span>
                </div>

                {activity.reason && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-700 italic">“{activity.reason}”</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length > 0 && (
        <div className="text-center text-xs text-slate-500">Showing {activities.length} activity {activities.length === 1 ? 'record' : 'records'}</div>
      )}
    </div>
  );
};

export default ActivityLog;
