'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import Toast from '@/components/Toast';
import Pagination from '@/components/Pagination';
import useToast from '@/hooks/useToast';
import { Activity, Search, Filter, Calendar, User, LogIn, FileText, Key, Users, Shield, Clock, RefreshCw, Download, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import Modal from '@/components/Modal';

const ACTION_COLORS = {
  USER_LOGIN: 'bg-green-100 text-green-800',
  USER_LOGOUT: 'bg-orange-100 text-orange-800',
  USER_REGISTERED: 'bg-blue-100 text-blue-800',
  USER_CREATED: 'bg-blue-100 text-blue-800',
  USER_UPDATED: 'bg-yellow-100 text-yellow-800',
  USER_DELETED: 'bg-red-100 text-red-800',
  ROLE_CHANGED: 'bg-purple-100 text-purple-800',
  PASSWORD_RESET: 'bg-orange-100 text-orange-800',
  TWO_FA_ENABLED: 'bg-pink-100 text-pink-800',
  TWO_FA_DISABLED: 'bg-pink-100 text-pink-800',
  GROUP_CREATED: 'bg-indigo-100 text-indigo-800',
  GROUP_UPDATED: 'bg-indigo-100 text-indigo-800',
  GROUP_DELETED: 'bg-indigo-100 text-indigo-800',
  PERMISSION_CHANGED: 'bg-teal-100 text-teal-800',
};

const ACTION_ICONS = {
  USER_LOGIN: LogIn,
  USER_LOGOUT: LogIn,
  USER_REGISTERED: User,
  USER_CREATED: User,
  USER_UPDATED: FileText,
  USER_DELETED: Users,
  ROLE_CHANGED: Shield,
  PASSWORD_RESET: Key,
  TWO_FA_ENABLED: Shield,
  TWO_FA_DISABLED: Shield,
  GROUP_CREATED: Users,
  GROUP_UPDATED: Users,
  GROUP_DELETED: Users,
  PERMISSION_CHANGED: Shield,
};

export default function ActivityTrackingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error: showError } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModal, setDetailsModal] = useState({ open: false, activity: null });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Only admins can access activity tracking
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchActivities();

    // Auto-refresh every 10 seconds
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActivities(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, router, autoRefresh]);

  const fetchActivities = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      const response = await api.get('/activity/all');
      setActivities(response.data.data || []);
      if (isRefresh) success('Activities refreshed successfully');
    } catch (err) {
      console.error('Error fetching activities:', err);
      showError('Failed to fetch activities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchActivities(true);
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch =
      activity.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = !actionFilter || activity.action_type === actionFilter;
    const matchesUser = !userFilter || activity.user_id?.toString() === userFilter;

    let matchesDate = true;
    if (dateFilter) {
      const activityDate = new Date(activity.created_at).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      matchesDate = activityDate === filterDate;
    }

    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique action types and users for filter
  const uniqueActions = [...new Set(activities.map(a => a.action_type))];
  const uniqueUsers = [...new Set(activities.map(a => ({ id: a.user_id, user_email: a.user_email, user_name: a.user_name })))];
  const uniqueUsersMap = Array.from(
    new Map(uniqueUsers.map(u => [u.id, u])).values()
  ).filter(u => u.id && u.user_email);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (actionType) => {
    const IconComponent = ACTION_ICONS[actionType] || Activity;
    return IconComponent;
  };

  // Calculate activity statistics
  const activityStats = activities.reduce((acc, activity) => {
    const type = activity.action_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(activityStats)
    .map(([action, count]) => ({
      name: action.replace(/_/g, ' '),
      count,
      action
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const CHART_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#dc2626', '#0891b2', '#f59e0b', '#8b5cf6'];

  const getActivityDescription = (activity) => {
    const actionType = activity.action_type;
    const userName = activity.user_name || activity.user_email || 'Unknown User';
    const description = activity.description || '';

    const descriptions = {
      USER_LOGIN: `${userName} logged in`,
      USER_LOGOUT: `${userName} logged out`,
      USER_REGISTERED: `${userName} registered a new account`,
      USER_CREATED: `${userName} was created`,
      USER_UPDATED: `${userName}'s profile was updated`,
      USER_DELETED: `${userName} was deleted`,
      ROLE_CHANGED: `${userName}'s role was changed`,
      PASSWORD_RESET: `${userName} reset their password`,
      TWO_FA_ENABLED: `${userName} enabled 2FA`,
      TWO_FA_DISABLED: `${userName} disabled 2FA`,
      GROUP_CREATED: `Group was created`,
      GROUP_UPDATED: `Group was updated`,
      GROUP_DELETED: `Group was deleted`,
      PERMISSION_CHANGED: `Permissions were changed`,
    };

    return descriptions[actionType] || `${userName} - ${actionType.replace(/_/g, ' ')}`;
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'User', 'Email', 'Action', 'Description', 'IP Address', 'Time'];
    const rows = filteredActivities.map(a => [
      a.id,
      a.user_name || 'N/A',
      a.user_email || 'N/A',
      a.action_type.replace(/_/g, ' '),
      a.description || '',
      a.ip_address || '',
      formatDate(a.created_at)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    success('Activities exported successfully');
  };

  return (
    <div className="flex h-screen bg-light">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                { label: 'Admin', href: '/dashboard/admin' },
                { label: 'Activity Tracking' }
              ]}
            />

            {/* Toast Notification */}
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={() => { }}
              />
            )}

            {/* Header with Refresh Toggle */}
            <PageHeader
              title="Activity Tracking"
              description="Monitor all user actions and system events."
              icon={Activity}
              actions={
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4 text-[#0b2b4c] rounded focus:ring-[#0b2b4c]"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto Refresh</span>
                  </label>
                  <button
                    onClick={handleExportCSV}
                    disabled={filteredActivities.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0b2b4c] text-white rounded-lg hover:bg-[#0b2b4c]/90 disabled:opacity-50 transition-colors shadow-sm active:scale-95 text-sm font-semibold"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-[#0b2b4c] hover:text-white disabled:opacity-50 transition-colors shadow-sm active:scale-95 text-sm font-semibold group"
                  >
                    <RefreshCw size={18} className={`group-hover:rotate-180 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              }
            />

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by user, email, or action..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Action Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <select
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                >
                  <option value="">All Users</option>
                  {uniqueUsersMap.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.user_name ? `${user.user_name} (${user.user_email})` : user.user_email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || actionFilter || dateFilter || userFilter) && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActionFilter('');
                    setDateFilter('');
                    setUserFilter('');
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Activity Summary Cards */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="text-sm text-gray-600">Total Activities</div>
                <div className="text-3xl font-bold text-primary mt-2">{activities.length}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-600">Logins</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {activities.filter(a => a.action_type === 'USER_LOGIN').length}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-600">User Changes</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {activities.filter(a => ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED'].includes(a.action_type)).length}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-600">Security Events</div>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  {activities.filter(a => ['PASSWORD_RESET', 'TWO_FA_ENABLED', 'TWO_FA_DISABLED', 'ROLE_CHANGED'].includes(a.action_type)).length}
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            {chartData.length > 0 && (
              <div className="mb-6 card p-6">
                <h2 className="text-lg font-semibold mb-4">Activity Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-600 mt-4">Loading activities...</p>
              </div>
            ) : (
              <>
                {/* Activities Timeline */}
                <div className="space-y-4">
                  {paginatedActivities.length === 0 ? (
                    <div className="card text-center py-12">
                      <Activity size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
                      <p className="text-gray-600">No activities found</p>
                    </div>
                  ) : (
                    <>
                      <div className="card">
                        <div className="p-6">
                          <h2 className="text-lg font-semibold mb-4">
                            Activity History ({filteredActivities.length} total)
                          </h2>
                          <div className="space-y-4">
                            {paginatedActivities.map((activity, idx) => {
                              const ActionIcon = getActionIcon(activity.action_type);
                              return (
                                <div
                                  key={idx}
                                  className="flex gap-4 pb-4 border-b last:border-b-0 hover:bg-gray-50 p-3 rounded transition cursor-pointer"
                                  onClick={() => setDetailsModal({ open: true, activity })}
                                >
                                  {/* Icon */}
                                  <div className={`flex-shrink-0 p-2 rounded-lg ${ACTION_COLORS[activity.action_type] || 'bg-gray-100 text-gray-800'}`}>
                                    <ActionIcon size={20} />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900 text-base">
                                          {getActivityDescription(activity)}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                          {activity.user_email && `📧 ${activity.user_email}`}
                                        </p>
                                        {activity.description && (
                                          <p className="text-sm text-gray-500 mt-1">
                                            💬 {activity.description}
                                          </p>
                                        )}
                                        {activity.ip_address && (
                                          <p className="text-xs text-gray-400 mt-1">
                                            🌐 IP: {activity.ip_address}
                                          </p>
                                        )}
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[activity.action_type] || 'bg-gray-100 text-gray-800'}`}>
                                        {activity.action_type.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Timestamp */}
                                  <div className="flex-shrink-0 text-right">
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Clock size={14} />
                                      <span>{formatDate(activity.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredActivities.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                          />
                        )}
                      </div>

                      {/* Activity Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="card p-4">
                          <div className="text-sm text-gray-600">Total Activities</div>
                          <div className="text-3xl font-bold text-primary mt-2">{activities.length}</div>
                        </div>
                        <div className="card p-4">
                          <div className="text-sm text-gray-600">Logins</div>
                          <div className="text-3xl font-bold text-green-600 mt-2">
                            {activities.filter(a => a.action_type === 'USER_LOGIN').length}
                          </div>
                        </div>
                        <div className="card p-4">
                          <div className="text-sm text-gray-600">User Changes</div>
                          <div className="text-3xl font-bold text-blue-600 mt-2">
                            {activities.filter(a => ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED'].includes(a.action_type)).length}
                          </div>
                        </div>
                        <div className="card p-4">
                          <div className="text-sm text-gray-600">Security Events</div>
                          <div className="text-3xl font-bold text-red-600 mt-2">
                            {activities.filter(a => ['PASSWORD_RESET', 'TWO_FA_ENABLED', 'TWO_FA_DISABLED', 'ROLE_CHANGED'].includes(a.action_type)).length}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Activity Details Modal */}
      <Modal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, activity: null })}
        title={detailsModal.activity ? `Activity Details - ${detailsModal.activity.action_type.replace(/_/g, ' ')}` : ''}
      >
        {detailsModal.activity && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Action Type</p>
                <p className="font-semibold text-gray-900">{detailsModal.activity.action_type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User</p>
                <p className="font-semibold text-gray-900">{detailsModal.activity.user_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timestamp</p>
                <p className="font-semibold text-gray-900">{formatDate(detailsModal.activity.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IP Address</p>
                <p className="font-semibold text-gray-900 break-all">{detailsModal.activity.ip_address || 'N/A'}</p>
              </div>
            </div>
            {detailsModal.activity.description && (
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-semibold text-gray-900">{detailsModal.activity.description}</p>
              </div>
            )}
            {detailsModal.activity.resource_type && (
              <div>
                <p className="text-sm text-gray-600">Resource Type</p>
                <p className="font-semibold text-gray-900">{detailsModal.activity.resource_type}</p>
              </div>
            )}
            {detailsModal.activity.resource_id && (
              <div>
                <p className="text-sm text-gray-600">Resource ID</p>
                <p className="font-semibold text-gray-900">{detailsModal.activity.resource_id}</p>
              </div>
            )}
            {detailsModal.activity.user_agent && (
              <div>
                <p className="text-sm text-gray-600">User Agent</p>
                <p className="text-xs text-gray-600 break-all">{detailsModal.activity.user_agent}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
