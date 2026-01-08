'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('activity'); // activity, login, summary
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportFilters, setExportFilters] = useState({
    actionType: '',
    userId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const [activityRes, loginRes, summaryRes] = await Promise.all([
        api.get('/activity/my-activity?limit=50'),
        api.get('/activity/my-login-history'),
        api.get('/activity/my-summary')
      ]);

      setActivities(activityRes.data.data);
      setLoginHistory(loginRes.data.data);
      setSummary(summaryRes.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch activity data');
      console.error('Activity data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setExportFilters((prev) => ({ ...prev, [field]: value }));
  };

  const exportCsv = async () => {
    setExporting(true);
    setExportError('');

    try {
      const params = {};
      if (exportFilters.actionType) params.actionType = exportFilters.actionType;
      if (exportFilters.userId) params.userId = exportFilters.userId;
      if (exportFilters.startDate) params.startDate = exportFilters.startDate;
      if (exportFilters.endDate) params.endDate = exportFilters.endDate;

      const response = await api.get('/activity/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'activity_export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export activities error:', err);
      const apiError = err?.response?.data?.error;
      setExportError(apiError || 'Export failed. Admin role required.');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActivityIcon = (actionType) => {
    const icons = {
      'LOGIN': '🔓',
      'LOGOUT': '🚪',
      'LOGIN_FAILED': '❌',
      'PROFILE_UPDATE': '👤',
      'PASSWORD_CHANGE': '🔑',
      'PASSWORD_RESET': '🔐',
      '2FA_ENABLED': '🛡️',
      '2FA_DISABLED': '🔓',
      'USER_CREATED': '👥',
      'USER_DELETED': '🗑️'
    };
    return icons[actionType] || '📝';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading activity logs...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Activity & History</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Activities (Admin)</CardTitle>
          <CardDescription>Filter and download CSV. Admin role required.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Action Type</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="e.g. LOGIN"
                value={exportFilters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">User ID (admin only)</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="User ID"
                value={exportFilters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={exportFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={exportFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {exportError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end mt-4">
            <Button onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'activity' ? 'default' : 'outline'}
          onClick={() => setActiveTab('activity')}
        >
          All Activities
        </Button>
        <Button
          variant={activeTab === 'login' ? 'default' : 'outline'}
          onClick={() => setActiveTab('login')}
        >
          Login History
        </Button>
        <Button
          variant={activeTab === 'summary' ? 'default' : 'outline'}
          onClick={() => setActiveTab('summary')}
        >
          Activity Summary
        </Button>
      </div>

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>All Activities</CardTitle>
            <CardDescription>Recent actions on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activities recorded</p>
              ) : (
                activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <span className="text-2xl">{getActivityIcon(activity.action_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{activity.action_type.replace(/_/g, ' ')}</h3>
                        <span className="text-sm text-gray-500">{formatDate(activity.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      {activity.ip_address && (
                        <p className="text-xs text-gray-500 mt-2">IP: {activity.ip_address}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login History Tab */}
      {activeTab === 'login' && (
        <Card>
          <CardHeader>
            <CardTitle>Login History</CardTitle>
            <CardDescription>Your recent login attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loginHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No login history</p>
              ) : (
                loginHistory.map((login, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <span className="text-2xl">🔓</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {login.action_type === 'LOGIN_SUCCESS' ? 'Successful Login' : 'Login Attempt'}
                        </h3>
                        <span className="text-sm text-gray-500">{formatDate(login.created_at)}</span>
                      </div>
                      {login.ip_address && (
                        <p className="text-sm text-gray-600 mt-1">IP Address: {login.ip_address}</p>
                      )}
                      {login.user_agent && (
                        <p className="text-xs text-gray-500 mt-2 truncate">{login.user_agent}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary (Last 30 Days)</CardTitle>
            <CardDescription>Overview of your account activities</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activities in the last 30 days</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summary.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                    <p className="text-2xl mb-2">{getActivityIcon(item.action_type)}</p>
                    <h3 className="font-semibold text-sm">{item.action_type.replace(/_/g, ' ')}</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{item.count}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
