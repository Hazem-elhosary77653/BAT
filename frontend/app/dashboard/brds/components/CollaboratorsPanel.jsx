'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Users, Eye, MessageSquare, Edit3, AlertCircle, Shield, UserPlus, Trash2, Mail } from 'lucide-react';
import api from '@/lib/api';

export default function CollaboratorsPanel({ brdId, userId }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('view');
  const [addingCollaborator, setAddingCollaborator] = useState(false);

  // Fetch collaborators
  useEffect(() => {
    fetchCollaborators();
  }, [brdId]);

  // Fetch available users when form is opened
  useEffect(() => {
    if (showAddForm) {
      fetchAvailableUsers();
    }
  }, [showAddForm]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/brd/${brdId}/collaborators`);
      const collaboratorData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setCollaborators(collaboratorData);
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users/reviewers'); // Reuse reviewers endpoint for general user list
      const filtered = (response.data.data || []).filter(
        (u) => String(u.id) !== String(userId) && !collaborators.some((c) => String(c.user_id) === String(u.id))
      );
      setAvailableUsers(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
      setAvailableUsers([]);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    setAddingCollaborator(true);
    setError('');

    try {
      await api.post(`/brd/${brdId}/collaborators`, {
        user_id: parseInt(selectedUserId),
        permission_level: selectedPermission,
      });

      setSelectedUserId('');
      setSelectedPermission('view');
      setShowAddForm(false);
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add collaborator');
    } finally {
      setAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Remove this collaborator?')) return;

    try {
      await api.delete(`/brd/${brdId}/collaborators/${collaboratorId}`);
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
    } catch (err) {
      setError('Failed to remove collaborator');
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'view': return <Eye className="w-3.5 h-3.5" />;
      case 'comment': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'edit': return <Edit3 className="w-3.5 h-3.5" />;
      default: return <Shield className="w-3.5 h-3.5" />;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'view': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'comment': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'edit': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Users className="w-12 h-12 text-slate-200 mb-4" />
        <div className="h-4 w-40 bg-slate-100 rounded-full mb-2"></div>
        <div className="h-3 w-32 bg-slate-50 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">Collaboration Space</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage shared access and permissions</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setError('');
          }}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${showAddForm
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-xl'
            }`}
        >
          {showAddForm ? <X size={16} /> : <UserPlus size={16} />}
          {showAddForm ? 'Close Portal' : 'Invite Specialist'}
        </button>
      </div>

      {/* Add Form Portal */}
      {showAddForm && (
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-1 font-sans animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[1.4rem] p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Select Personnel</label>
                <div className="relative">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full pl-4 pr-10 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose team member...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Plus size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Access Protocol</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'view', label: 'View', desc: 'Read-only', icon: Eye },
                    { id: 'comment', label: 'Discuss', desc: 'Can feedbk', icon: MessageSquare },
                    { id: 'edit', label: 'Modify', desc: 'Full edit', icon: Edit3 }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPermission(p.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${selectedPermission === p.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                      <p.icon size={18} className="mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-tight">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-500 italic max-w-xs">
                {selectedPermission === 'view' && "Stakeholders can view the blueprint but cannot leave annotations."}
                {selectedPermission === 'comment' && "Reviewers can annotate sections and join discussions."}
                {selectedPermission === 'edit' && "Collaborators have administrative rights to modify the protocol."}
              </p>
              <button
                onClick={handleAddCollaborator}
                disabled={addingCollaborator || !selectedUserId}
                className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all disabled:opacity-40"
              >
                {addingCollaborator ? 'Granting Access...' : 'Share Blueprint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border-2 border-rose-100 bg-rose-50 p-4 text-rose-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0" />
          <span className="font-bold text-sm tracking-tight">{error}</span>
        </div>
      )}

      {/* Collaborators List */}
      {collaborators.length === 0 ? (
        <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Shield size={32} />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h4 className="text-xl font-black text-slate-900">Restricted Blueprint</h4>
            <p className="text-sm font-medium text-slate-500">Currently, only you have access to this document protocol. Invite team members to collaborate.</p>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="group rounded-[2.5rem] border border-slate-100 bg-white p-6 flex items-start gap-4 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100/50 transition-colors" />

              <div className="w-16 h-16 rounded-[1.4rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-100 shrink-0">
                {collaborator.user_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>

              <div className="flex-1 space-y-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 leading-none mb-1">{collaborator.user_name || 'Anonymous Peer'}</h4>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
                      <Mail size={12} /> {collaborator.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getPermissionColor(collaborator.permission_level)}`}>
                    {getPermissionIcon(collaborator.permission_level)}
                    {collaborator.permission_level === 'comment' ? 'Reviewer' : collaborator.permission_level === 'edit' ? 'Architect' : 'Observer'}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                    Access Granted {new Date(collaborator.added_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
