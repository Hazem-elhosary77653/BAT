'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import Toast from '@/components/Toast';
import useToast from '@/hooks/useToast';
import { Shield, Eye, Edit2, Trash2, Plus } from 'lucide-react';

export default function PermissionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error: showError, close: closeToast } = useToast();
  const [rolePermissions, setRolePermissions] = useState({});
  const [customPermissions, setCustomPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    resource: ''
  });
  const [selectedActions, setSelectedActions] = useState([]);
  const [customAction, setCustomAction] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [expandedRoles, setExpandedRoles] = useState(new Set());

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Permission check is handled by backend
    fetchPermissions();
  }, [user, router]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const [allRolesRes, customRes] = await Promise.all([
        api.get('/permissions/all'),
        api.get('/permissions')
      ]);

      setRolePermissions(allRolesRes.data?.data || {});
      const defaultRoles = ['admin', 'analyst', 'viewer'];
      const dbRows = customRes.data?.data || [];
      const nonDefaultRows = dbRows.filter((row) => !defaultRoles.includes(row.role));
      setCustomPermissions(nonDefaultRows);
      if (!formData.role && allRolesRes.data?.data) {
        const availableRoles = Object.keys(allRolesRes.data.data);
        setFormData((prev) => ({ ...prev, role: availableRoles[0] || '__new__' }));
      }
      const initialExpanded = new Set(Object.keys(allRolesRes.data?.data || {}));
      setExpandedRoles(initialExpanded);
      success('Permissions loaded');
    } catch (err) {
      console.error('Error fetching permissions:', err);
      showError(err.response?.data?.error || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = useMemo(() => {
    const roles = new Set();
    Object.keys(rolePermissions || {}).forEach((role) => roles.add(role));
    customPermissions.forEach(({ role }) => roles.add(role));
    return Array.from(roles).sort();
  }, [rolePermissions, customPermissions]);

  const resourceOptions = useMemo(() => {
    const resources = new Set();
    Object.values(rolePermissions || {}).forEach((resourceMap) => {
      Object.keys(resourceMap || {}).forEach((res) => resources.add(res));
    });
    customPermissions.forEach(({ resource }) => resources.add(resource));
    return Array.from(resources).sort();
  }, [rolePermissions, customPermissions]);

  const handleAddPermission = async (e) => {
    e.preventDefault();
    const actions = [...selectedActions];
    if (customAction.trim()) actions.push(customAction.trim());
    const roleValue = formData.role === '__new__' ? newRoleName.trim() : formData.role;
    if (!roleValue || !formData.resource || actions.length === 0) {
      showError('Role, resource, and at least one action are required');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        role: roleValue.trim(),
        resource: formData.resource.trim()
      };

      if (editTarget) {
        await api.delete('/permissions', { data: editTarget });
      }

      await Promise.all(
        actions.map((action) =>
          api.post('/permissions', { ...payload, action })
        )
      );
      success(editTarget ? 'Permission updated' : 'Permission added');
      setSelectedActions([]);
      setCustomAction('');
      setNewRoleName('');
      setEditTarget(null);
      fetchPermissions();
    } catch (err) {
      console.error('Error adding permission:', err);
      showError(err.response?.data?.error || 'Failed to add permission');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePermission = async (roleOrPerm, resource, action) => {
    let role, res, act;
    
    // Support both old (perm object) and new (role, resource, action) calling styles
    if (typeof roleOrPerm === 'object') {
      role = roleOrPerm.role;
      res = roleOrPerm.resource;
      act = roleOrPerm.action;
    } else {
      role = roleOrPerm;
      res = resource;
      act = action;
    }

    if (!confirm(`Remove ${act} on ${res} for ${role}?`)) return;
    try {
      setDeleting(`${role}-${res}-${act}`);
      await api.delete('/permissions', {
        data: {
          role,
          resource: res,
          action: act
        }
      });
      success('Permission removed');
      if (editTarget && editTarget.role === role && editTarget.resource === res && editTarget.action === act) {
        setEditTarget(null);
      }
      fetchPermissions();
    } catch (err) {
      console.error('Error removing permission:', err);
      showError(err.response?.data?.error || 'Failed to remove permission');
    } finally {
      setDeleting(null);
    }
  };

  const formatPermissionText = (text) => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const toggleAction = (action) => {
    setSelectedActions((prev) => {
      const exists = prev.includes(action);
      if (exists) return prev.filter((a) => a !== action);
      return [...prev, action];
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                { label: 'Admin', href: '/dashboard/admin' },
                { label: 'Roles & Permissions' }
              ]}
            />

            {/* Toast */}
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={closeToast}
              />
            )}

            {/* Page Header */}
            <div className="mb-8 mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Roles & Permissions
                  </h1>
                  <p className="text-gray-600">Manage user roles and their associated permissions</p>
                </div>
                <button
                  onClick={fetchPermissions}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-24">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-600 mt-4">Loading permissions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-md sticky top-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                      <Shield size={20} className="text-primary" />
                      Add Permission
                    </h2>

                    <form className="space-y-4" onSubmit={handleAddPermission}>
                      {/* Role Selection */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Role</label>
                        <select
                          className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.role}
                          onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                        >
                          <option value="">Choose...</option>
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>{formatPermissionText(role)}</option>
                          ))}
                          <option value="__new__">➕ New Role</option>
                        </select>
                      </div>

                      {/* New Role Name */}
                      {formData.role === '__new__' && (
                        <div>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 text-sm border-2 border-purple-300 rounded-lg bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Role name"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Resource Selection */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Resource</label>
                        <select
                          className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.resource}
                          onChange={(e) => setFormData((prev) => ({ ...prev, resource: e.target.value }))}
                        >
                          <option value="">Choose...</option>
                          {resourceOptions.map((res) => (
                            <option key={res} value={res}>{formatPermissionText(res)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Permissions - Compact Toggle List */}
                      {formData.resource && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <h4 className="text-xs font-bold text-gray-700 uppercase mb-2.5">Permissions</h4>
                          <div className="space-y-1.5">
                            {['create', 'read', 'update', 'delete', 'manage_roles', 'export'].map((action) => (
                              <label key={action} className="flex items-center gap-2 cursor-pointer hover:bg-white rounded px-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={selectedActions.includes(action)}
                                  onChange={() => toggleAction(action)}
                                  className="w-4 h-4 rounded text-primary"
                                />
                                <span className="text-xs text-gray-700 font-medium">{formatPermissionText(action)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={formLoading || !formData.role || !formData.resource || selectedActions.length === 0}
                        className="w-full mt-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-lg font-bold text-sm transition"
                      >
                        {formLoading ? 'Adding...' : 'Add Permission'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Column: Roles List */}
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-blue-500" />
                    Custom Roles ({customPermissions.length > 0 ? new Set(customPermissions.map(p => p.role)).size : 0})
                  </h2>

                  {customPermissions.length === 0 ? (
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <p className="text-gray-600 font-medium">No custom roles yet</p>
                      <p className="text-sm text-gray-500 mt-1">Use the form on the left to create one</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const grouped = {};
                        customPermissions.forEach((perm) => {
                          if (!grouped[perm.role]) grouped[perm.role] = {};
                          if (!grouped[perm.role][perm.resource]) grouped[perm.role][perm.resource] = [];
                          grouped[perm.role][perm.resource].push(perm.action);
                        });

                        return Object.entries(grouped).map(([role, resources]) => (
                          <div key={role} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b text-blue-600">{formatPermissionText(role)}</h3>
                            <div className="space-y-2.5">
                              {Object.entries(resources).map(([resource, actions]) => (
                                <div key={`${role}-${resource}`}>
                                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1.5">{formatPermissionText(resource)}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {actions.map((action) => (
                                      <span
                                        key={`${role}-${resource}-${action}`}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-100 transition group"
                                      >
                                        {formatPermissionText(action)}
                                        <button
                                          onClick={() => handleDeletePermission(role, resource, action)}
                                          disabled={deleting === `${role}-${resource}-${action}`}
                                          className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-red-600 transition"
                                          title="Remove"
                                        >
                                          ✕
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
