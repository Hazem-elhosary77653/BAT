'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import Toast from '@/components/Toast';
import Pagination from '@/components/Pagination';
import ModalNew from '@/components/ModalNew';
import useToast from '@/hooks/useToast';
import { Users, Edit2, Trash2, Shield, Power, Plus, Search, Key } from 'lucide-react';

export default function UserManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error: showError, warning, close: closeToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active | inactive | all
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    mobile: '',
    password: '',
    role: 'analyst',
    isActive: true
  });
  const [sessionModal, setSessionModal] = useState({ open: false, user: null, sessions: [], loading: false });
  const [auditModal, setAuditModal] = useState({ open: false, user: null, data: null, loading: false });
  const [resetModal, setResetModal] = useState({ open: false, user: null, password: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null, loading: false });
  const [detailModal, setDetailModal] = useState({ open: false, user: null });
  const [roleOptions, setRoleOptions] = useState(['admin', 'analyst', 'viewer']);
  const [userPermissions, setUserPermissions] = useState(null);

  const isActionBusy = (id, type) => actionLoading.id === id && actionLoading.type === type;
  const startAction = (id, type) => setActionLoading({ id, type });
  const stopAction = () => setActionLoading({ id: null, type: null });
  const withRowSafe = (fn) => (e) => {
    e.stopPropagation();
    fn(e);
  };
  const openUserDetails = (userData) => setDetailModal({ open: true, user: userData });
  const closeUserDetails = () => setDetailModal({ open: false, user: null });

  const itemsPerPage = 10;

  const userStats = useMemo(() => {
    const counts = users.reduce(
      (acc, u) => {
        if (u.is_active) acc.active += 1; else acc.inactive += 1;
        acc.total += 1;
        return acc;
      },
      { active: 0, inactive: 0, total: 0 }
    );
    return counts;
  }, [users]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Allow access if user has 'users' resource permission (not just admin role)
    // The backend will enforce specific action permissions

    fetchUsers();
    fetchRoles();
    fetchUserPermissions();
  }, [user, router]);

  useEffect(() => {
    if (!formData.role && roleOptions.length) {
      setFormData((prev) => ({ ...prev, role: roleOptions[0] }));
    }
  }, [roleOptions]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params: { includeInactive: true } });
      setUsers(response.data.data);
      success('Users loaded successfully');
    } catch (err) {
      console.error('Error fetching users:', err);
      showError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/permissions/all');
      const roles = Object.keys(response.data?.data || {});
      if (roles.length) {
        setRoleOptions((prev) => Array.from(new Set([...prev, ...roles])));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const response = await api.get('/permissions/accessible');
      const resources = response.data?.data?.resources || [];
      const actions = response.data?.data?.actions || {};
      setUserPermissions({ resources, actions });
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setUserPermissions({ resources: [], actions: {} });
    }
  };

  const hasPermission = (resource, action) => {
    if (!userPermissions) return true; // Loading state
    if (user?.role === 'admin') return true; // Admin has all permissions
    const resourceActions = userPermissions.actions[resource] || [];
    return resourceActions.includes(action);
  };

  const filteredUsers = users
    .filter((u) => {
      if (statusFilter === 'active') return u.is_active;
      if (statusFilter === 'inactive') return !u.is_active;
      return true;
    })
    .filter(u =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (`${u.first_name} ${u.last_name}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openEditModal = (userData) => {
    setIsCreating(false);
    setEditingUser(userData);
    setFormData({
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      email: userData.email || '',
      username: userData.username || '',
      mobile: userData.mobile || '',
      password: '',
      role: userData.role || 'analyst',
      isActive: userData.is_active !== false
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      mobile: '',
      password: '',
      role: roleOptions[0] || 'analyst',
      isActive: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setIsCreating(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      mobile: '',
      password: '',
      role: 'analyst',
      isActive: true
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const role = (formData.role || '').trim();
      if (!role) {
        showError('Role is required');
        return;
      }
      if (isCreating) {
        // Create new user
        if (!formData.password) {
          showError('Password is required');
          return;
        }
        await api.post('/users', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          mobile: formData.mobile,
          password: formData.password,
          role
        });
        success('User created successfully');
      } else {
        // Update existing user
        await api.put(`/users/${editingUser.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          mobile: formData.mobile,
          role,
          isActive: formData.isActive
        });
        success('User updated successfully');
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error('Error saving user:', err);
      showError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const roleName = (newRole || '').trim();
    if (!roleName) {
      showError('Role name is required');
      return;
    }
    try {
      startAction(userId, 'role');
      await api.patch(`/users/${userId}/role`, { role: roleName });
      setRoleOptions((prev) => (prev.includes(roleName) ? prev : [...prev, roleName]));
      fetchUsers();
      success('User role updated successfully');
    } catch (err) {
      console.error('Error changing role:', err);
      showError('Failed to change user role');
    } finally {
      stopAction();
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!confirm(`${currentStatus ? 'Deactivate' : 'Activate'} user?`)) return;

    try {
      startAction(userId, 'status');
      await api.patch(`/users/${userId}/status`, { isActive: !currentStatus });
      fetchUsers();
      success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error toggling status:', err);
      showError('Failed to toggle user status');
    } finally {
      stopAction();
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      startAction(deleteModal.user.id, 'delete');
      await api.delete(`/users/${deleteModal.user.id}`);
      // Optimistically remove from UI
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id));
      success('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      showError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      stopAction();
      setDeleteModal({ open: false, user: null, loading: false });
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    if (!confirm(`Reset password for ${userEmail}? A new random password will be generated.`)) return;

    try {
      startAction(userId, 'reset');
      const response = await api.post(`/users/${userId}/reset-password`);
      const { newPassword } = response.data.data;

      setResetModal({ open: true, user: userEmail, password: newPassword });
      navigator.clipboard.writeText(newPassword);
      success('New password generated and copied to clipboard');
      fetchUsers();
    } catch (err) {
      console.error('Error resetting password:', err);
      showError('Failed to reset password');
    } finally {
      stopAction();
    }
  };

  const openSessionsModal = async (userData) => {
    startAction(userData.id, 'sessions');
    setSessionModal({ open: true, user: userData, sessions: [], loading: true });
    try {
      const response = await api.get('/sessions', { params: { userId: userData.id } });
      const sessions = response.data?.data?.sessions || [];
      setSessionModal({ open: true, user: userData, sessions, loading: false });
    } catch (err) {
      console.error('Error fetching sessions:', err);
      showError('Failed to load sessions');
      setSessionModal({ open: true, user: userData, sessions: [], loading: false });
    } finally {
      stopAction();
    }
  };

  const terminateSession = async (sessionId) => {
    if (!sessionModal.user) return;
    try {
      startAction(sessionModal.user.id, `session-${sessionId}`);
      await api.post(`/sessions/${sessionId}/terminate`, { userId: sessionModal.user.id });
      success('Session terminated');
      // refresh list
      const response = await api.get('/sessions', { params: { userId: sessionModal.user.id } });
      const sessions = response.data?.data?.sessions || [];
      setSessionModal((prev) => ({ ...prev, sessions }));
    } catch (err) {
      console.error('Error terminating session:', err);
      showError('Failed to terminate session');
    } finally {
      stopAction();
    }
  };

  const openAuditModal = async (userData) => {
    startAction(userData.id, 'audit');
    setAuditModal({ open: true, user: userData, data: null, loading: true });
    try {
      const response = await api.get(`/users/${userData.id}/audit`);
      setAuditModal({ open: true, user: userData, data: response.data?.data, loading: false });
    } catch (err) {
      console.error('Error fetching audit snapshot:', err);
      showError('Failed to load audit details');
      setAuditModal({ open: true, user: userData, data: null, loading: false });
    } finally {
      stopAction();
    }
  };

  const handleForceLogout = async (userId, userName) => {
    if (!confirm(`Force logout ${userName} from all devices? They will be logged out immediately.`)) return;

    try {
      startAction(userId, 'force-logout');
      const response = await api.post(`/sessions/terminate-all`, { userId });
      if (response.data?.success) {
        success(`${userName} has been logged out from all devices`);
        fetchUsers();
      } else {
        showError(response.data?.message || 'Failed to force logout user');
      }
    } catch (err) {
      console.error('Error forcing logout:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to force logout user';
      showError(errorMessage);
    } finally {
      stopAction();
    }
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
                { label: 'User Management' }
              ]}
            />

            {/* Toast Notification */}
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={closeToast}
              />
            )}

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[var(--color-text)] mb-2">
                User Management
              </h1>
              <p className="text-[var(--color-text-muted)]">Manage users and assign roles and permissions</p>
            </div>

            {/* Search and Actions */}
            {/* Quick stats */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Active', value: userStats.active },
                { label: 'Inactive', value: userStats.inactive },
                { label: 'Total', value: userStats.total },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{value}</div>
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by email, username, or name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center gap-2">
                {['active', 'inactive', 'all'].map((filter) => {
                  const label = filter === 'active' ? 'Active' : filter === 'inactive' ? 'Inactive' : 'All';
                  const count = filter === 'active' ? userStats.active : filter === 'inactive' ? userStats.inactive : userStats.total;
                  const isSelected = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => {
                        setStatusFilter(filter);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-primary'
                      }`}
                    >
                      <span className="mr-2">{label}</span>
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-strong)] text-[var(--color-text-muted)]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {hasPermission('users', 'create') && (
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2 self-start md:self-auto shadow-sm"
                >
                  <Plus size={20} />
                  Add User
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-[var(--color-text-muted)] mt-4">Loading users...</p>
              </div>
            ) : (
              <>
                {/* Users Table */}
                <div className="table-shell">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--color-surface-strong)] border-b border-[var(--color-border)]">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text)]">User</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text)]">Email</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text)]">Role</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text)]">Status</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text)]">Created</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                              <Users size={32} className="mx-auto mb-2 opacity-50" />
                              <p>No users found</p>
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((userData) => {
                            const isSelf = user?.id === userData.id;
                            return (
                            <tr
                              key={userData.id}
                              className="hover:bg-gray-50 transition cursor-pointer"
                              onClick={() => openUserDetails(userData)}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {userData.first_name} {userData.last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">@{userData.username}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-[var(--color-text)] font-medium">{userData.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                {hasPermission('users', 'manage_roles') ? (
                                  <select
                                    value={userData.role}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleChangeRole(userData.id, e.target.value)}
                                    disabled={isActionBusy(userData.id, 'role')}
                                    className={`px-3 py-1 rounded-full text-sm font-medium border disabled:opacity-50 ${
                                      userData.role === 'admin'
                                        ? 'bg-red-100 text-red-800 border-red-200'
                                        : userData.role === 'analyst'
                                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                    }`}
                                  >
                                  {[userData.role, ...roleOptions.filter((r) => r !== userData.role)].map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                  </select>
                                ) : (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                    userData.role === 'admin'
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : userData.role === 'analyst'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}>
                                    {userData.role}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {hasPermission('users', 'manage_status') ? (
                                  <button
                                    onClick={withRowSafe(() => handleToggleStatus(userData.id, userData.is_active))}
                                    disabled={isActionBusy(userData.id, 'status')}
                                    className={`px-3 py-1 rounded-full text-sm font-medium disabled:opacity-50 ${
                                      userData.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {userData.is_active ? 'Active' : 'Inactive'}
                                  </button>
                                ) : (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    userData.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {userData.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-surface-strong)] text-[var(--color-text)] border border-[var(--color-border)]">
                                  {new Date(userData.created_at).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {hasPermission('users', 'update') && (
                                    <button
                                      aria-label="Edit user"
                                      onClick={withRowSafe(() => openEditModal(userData))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-blue-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50/70 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Edit user"
                                      disabled={isActionBusy(userData.id, 'edit')}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  )}
                                  {hasPermission('users', 'read') && (
                                    <button
                                      aria-label="Audit highlights"
                                      onClick={withRowSafe(() => openAuditModal(userData))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-amber-600 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50/70 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="View audit highlights"
                                      disabled={isActionBusy(userData.id, 'audit')}
                                    >
                                      <Shield size={16} />
                                    </button>
                                  )}
                                  {hasPermission('sessions', 'read') && (
                                    <button
                                      aria-label="View sessions"
                                      onClick={withRowSafe(() => openSessionsModal(userData))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-teal-600 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50/70 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="View sessions"
                                      disabled={isActionBusy(userData.id, 'sessions')}
                                    >
                                      <Users size={16} />
                                    </button>
                                  )}
                                  {hasPermission('users', 'reset_password') && (
                                    <button
                                      aria-label="Reset password"
                                      onClick={withRowSafe(() => handleResetPassword(userData.id, userData.email))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-orange-600 hover:text-orange-700 hover:border-orange-200 hover:bg-orange-50/70 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Reset password"
                                      disabled={isActionBusy(userData.id, 'reset')}
                                    >
                                      <Key size={16} />
                                    </button>
                                  )}
                                  {hasPermission('sessions', 'terminate') && (
                                    <button
                                      aria-label="Force logout"
                                      onClick={withRowSafe(() => handleForceLogout(userData.id, userData.first_name + ' ' + userData.last_name))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-purple-600 hover:text-purple-700 hover:border-purple-200 hover:bg-purple-50/70 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Force logout from all devices"
                                      disabled={isSelf || isActionBusy(userData.id, 'force-logout')}
                                    >
                                      <Power size={16} />
                                    </button>
                                  )}
                                  {hasPermission('users', 'delete') && (
                                    <button
                                      aria-label="Delete user"
                                      onClick={withRowSafe(() => setDeleteModal({ open: true, user: userData, loading: false }))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-gray-200 text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50/70 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Delete user"
                                      disabled={isSelf || isActionBusy(userData.id, 'delete')}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )})
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredUsers.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      <ModalNew
        isOpen={showModal}
        onClose={closeModal}
        title={isCreating ? 'Create New User' : 'Edit User'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                </div>

                {isCreating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Min 6 characters"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[formData.role, ...roleOptions.filter((r) => r !== formData.role)].map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {!isCreating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition"
                >
                  {formLoading ? 'Saving...' : (isCreating ? 'Create User' : 'Save Changes')}
                </button>
              </div>
            </form>
      </ModalNew>

      {/* Sessions Modal */}
      <ModalNew
        isOpen={sessionModal.open}
        onClose={() => setSessionModal({ open: false, user: null, sessions: [], loading: false })}
        title={`Sessions${sessionModal.user ? ` - ${sessionModal.user.first_name} ${sessionModal.user.last_name}` : ''}`}
        size="lg"
      >
        {sessionModal.loading ? (
          <div className="py-6 text-center text-gray-600">Loading sessions...</div>
        ) : sessionModal.sessions.length === 0 ? (
          <div className="py-6 text-center text-gray-600">No sessions found</div>
        ) : (
          <div className="space-y-3">
            {sessionModal.sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-700">IP: {session.ipAddress || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 mt-1">Device: {session.userAgent || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">Login: {session.loginTime ? new Date(session.loginTime).toLocaleString() : 'N/A'}</div>
                  <div className="text-xs text-gray-500">Last activity: {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'N/A'}</div>
                </div>
                                  <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${session.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {session.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {session.isActive && (
                    <button
                      onClick={() => terminateSession(session.id)}
                      disabled={isActionBusy(sessionModal.user?.id, `session-${session.id}`)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalNew>

      {/* Audit Modal */}
      <ModalNew
        isOpen={auditModal.open}
        onClose={() => setAuditModal({ open: false, user: null, data: null, loading: false })}
        title={`Audit Highlights${auditModal.user ? ` - ${auditModal.user.first_name} ${auditModal.user.last_name}` : ''}`}
        size="md"
      >
        {auditModal.loading ? (
          <div className="py-6 text-center text-gray-600">Loading audit details...</div>
        ) : !auditModal.data ? (
          <div className="py-6 text-center text-gray-600">No audit data available</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-3 bg-gray-50">
                <div className="text-xs text-gray-500">Last Login</div>
                <div className="text-sm text-gray-800">{auditModal.data.lastLogin ? new Date(auditModal.data.lastLogin).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="card p-3 bg-gray-50">
                <div className="text-xs text-gray-500">Last Password Reset</div>
                <div className="text-sm text-gray-800">{auditModal.data.lastPasswordReset ? new Date(auditModal.data.lastPasswordReset).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="card p-3 bg-gray-50">
                <div className="text-xs text-gray-500">Active Sessions</div>
                <div className="text-2xl font-semibold text-primary">{auditModal.data.activeSessions}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Recent Actions</div>
              {auditModal.data.recentActions?.length ? (
                <ul className="space-y-2 text-sm text-gray-700">
                  {auditModal.data.recentActions.map((a, idx) => (
                    <li key={idx} className="flex justify-between border-b pb-1">
                      <span>{a.action}</span>
                      <span className="text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No recent actions</div>
              )}
            </div>
          </div>
        )}
      </ModalNew>

      {/* Reset Password Modal */}
      <ModalNew
        isOpen={resetModal.open}
        onClose={() => setResetModal({ open: false, user: null, password: '' })}
        title="Temporary Password"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Share this temporary password with <span className="font-semibold">{resetModal.user}</span> and ask them to change it after logging in.
          </p>
          <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
            <span className="font-mono text-lg">{resetModal.password}</span>
            <button
              onClick={() => navigator.clipboard.writeText(resetModal.password)}
              className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setResetModal({ open: false, user: null, password: '' })}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Close
          </button>
        </div>
      </ModalNew>

      {/* User Detail Modal */}
      <ModalNew
        isOpen={detailModal.open}
        onClose={closeUserDetails}
        title={detailModal.user ? `${detailModal.user.first_name} ${detailModal.user.last_name}` : 'User Details'}
        size="md"
      >
        {detailModal.user && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900 break-all">{detailModal.user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Username</p>
                <p className="font-medium text-gray-900">@{detailModal.user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Role</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  detailModal.user.role === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : detailModal.user.role === 'analyst'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {detailModal.user.role}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  detailModal.user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {detailModal.user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{new Date(detailModal.user.created_at).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Mobile</p>
                <p className="font-medium text-gray-900">{detailModal.user.mobile || '—'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  openEditModal(detailModal.user);
                  closeUserDetails();
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
              >
                Edit
              </button>
              <button
                onClick={() => setDetailModal({ open: false, user: null })}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ModalNew>

      {/* Delete Confirmation Modal */}
      <ModalNew
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null, loading: false })}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            هل أنت متأكد من حذف المستخدم <span className="font-semibold">@{deleteModal.user?.username}</span>؟
          </p>
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="font-semibold text-gray-900">{deleteModal.user?.first_name} {deleteModal.user?.last_name}</div>
            <div className="text-sm text-gray-600">{deleteModal.user?.email}</div>
            <div className="text-sm text-gray-600">@{deleteModal.user?.username}</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModal({ open: false, user: null, loading: false })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={deleteModal.loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={deleteModal.loading}
            >
              {deleteModal.loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </ModalNew>
    </div>
  );
}
