'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
  Plus,
  Search,
  FileText,
  Layout,
  MessageSquare,
  Mail,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Check,
  X,
  Info,
  AlertCircle,
  MoreVertical,
  Filter,
  Save,
  Code
} from 'lucide-react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';

const CATEGORIES = [
  { id: 'brd', label: 'BRD Documents', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'story', label: 'User Stories', icon: Layout, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'document', label: 'General Documents', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'email', label: 'Email Templates', icon: Mail, color: 'text-orange-500', bg: 'bg-orange-50' }
];

export default function TemplatesPage() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [status, setStatus] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    content: '',
    category: 'brd',
    is_public: false,
    variables: []
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Automatically detect variables in content
  useEffect(() => {
    const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = form.content.matchAll(variableRegex);
    const vars = Array.from(new Set(Array.from(matches, m => m[1])));
    setForm(prev => ({ ...prev, variables: vars }));
  }, [form.content]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/templates');
      setTemplates(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setStatus({ type: 'error', message: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, form);
        setStatus({ type: 'success', message: 'Template updated successfully!' });
      } else {
        await api.post('/templates', form);
        setStatus({ type: 'success', message: 'Template created successfully!' });
      }
      setIsModalOpen(false);
      resetForm();
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to save template' });
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await api.delete(`/templates/${templateToDelete.id}`);
      setStatus({ type: 'success', message: 'Template deleted successfully' });
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      setStatus({ type: 'error', message: 'Failed to delete template' });
    }
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      description: template.description || '',
      content: template.content,
      category: template.category,
      is_public: template.is_public === 1,
      variables: template.variables || []
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      description: '',
      content: '',
      category: 'brd',
      is_public: false,
      variables: []
    });
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, filterCategory]);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Templates Management" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCategory === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    All
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCategory === cat.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {cat.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>

            {/* Status Messages */}
            {status && (
              <div className={`p-4 rounded-xl flex items-center justify-between slide-in ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                <div className="flex items-center gap-3">
                  {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-sm font-medium">{status.message}</span>
                </div>
                <button onClick={() => setStatus(null)}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Template Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
                ))}
              </div>
            ) : filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => {
                  const category = CATEGORIES.find(c => c.id === template.category) || CATEGORIES[0];
                  const Icon = category.icon;

                  return (
                    <div
                      key={template.id}
                      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl ${category.bg} ${category.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setViewingTemplate(template)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                              title="View Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(template)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setTemplateToDelete(template); setIsDeleteModalOpen(true); }}
                              className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{template.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{template.description || 'No description provided.'}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <Code className="w-3 h-3" />
                              {template.variables?.length || 0} Variables
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${template.is_public ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                            {template.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="p-6 bg-slate-50 rounded-full mb-4">
                  <Layout className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No templates found</h3>
                <p className="text-slate-500 mb-6 max-w-sm text-center">Get started by creating your first custom template to power your AI generation workflow.</p>
                <button
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                  Create Custom Template
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTemplate ? 'Edit Template' : 'Create Custom Template'}
          size="xl"
        >
          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="e.g., Simple BRD Template"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="Describe what this template is used for..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg">
                    <Info className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">Pro Tip: Variables</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">Use <code>{`{{variable_name}}`}</code> in your content. The AI system will identify these and fill them with appropriate data.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col h-full">
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template Content (Markdown supported)</label>
                  <textarea
                    required
                    className="flex-1 w-full px-4 py-3 bg-slate-900 text-slate-100 font-mono text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none min-h-[300px]"
                    placeholder="# Executive Summary&#10;{{project_overview}}"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>

                {form.variables.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Detected Variables</label>
                    <div className="flex flex-wrap gap-2">
                      {form.variables.map(v => (
                        <span key={v} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100 uppercase tracking-tight">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Shared Template (Public)</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={!!viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          title={viewingTemplate?.name || 'Preview'}
          size="lg"
        >
          <div className="space-y-6">
            <div className="prose prose-slate max-w-none">
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl font-mono text-sm overflow-auto whitespace-pre-wrap max-h-[500px]">
                {viewingTemplate?.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</span>
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.id === viewingTemplate?.category);
                    const Icon = cat?.icon || Info;
                    return <><Icon className="w-4 h-4 text-blue-500" /> {cat?.label || 'General'}</>;
                  })()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Variables Identified</span>
                <span className="text-sm font-bold text-slate-700">{viewingTemplate?.variables?.length || 0} Dynamic Tags</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingTemplate.content);
                  setStatus({ type: 'success', message: 'Content copied to clipboard!' });
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy Source
              </button>
              <button
                onClick={() => setViewingTemplate(null)}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Template"
          size="sm"
        >
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h3>
              <p className="text-slate-500 text-sm">Are you sure you want to delete <span className="font-bold text-slate-700">"{templateToDelete?.name}"</span>? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>

      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
