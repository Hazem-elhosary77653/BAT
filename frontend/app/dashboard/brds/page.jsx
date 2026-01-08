'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
  Plus, Edit2, Trash2, Sparkles, Search, FileText, Download,
  Eye, Clock, ChevronDown, ChevronUp, RefreshCw, Copy, Check,
  AlertCircle, Filter, History, X, FileDown, ChevronRight
} from 'lucide-react';

export default function BRDsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // State
  const [brds, setBRDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStories, setUserStories] = useState([]);
  const [aiStories, setAiStories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [expandedBRD, setExpandedBRD] = useState(null);

  // Status messages
  const [status, setStatus] = useState(null);

  // Modals
  const [generateModal, setGenerateModal] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, brd: null });
  const [editModal, setEditModal] = useState({ open: false, brd: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, brdId: null });
  const [versionsModal, setVersionsModal] = useState({ open: false, brdId: null, versions: [] });

  // Generate form
  const [generateForm, setGenerateForm] = useState({
    selectedStories: [],
    title: '',
    template: 'full',
    useAiStories: true,
  });
  const [generating, setGenerating] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);

  // Auto-hide status
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBRDs();
    fetchUserStories();
    fetchAiStories();
  }, [user, router]);

  const fetchBRDs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brd');
      setBRDs(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching BRDs:', err);
      // Don't show error for initial load - might just be empty
      setBRDs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStories = async () => {
    try {
      const response = await api.get('/user-stories');
      const data = response.data;
      // Handle both array and object with data property
      setUserStories(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Error fetching user stories:', err);
      setUserStories([]);
    }
  };

  const fetchAiStories = async () => {
    try {
      const response = await api.get('/ai/stories/all');
      setAiStories(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching AI stories:', err);
      setAiStories([]);
    }
  };

  // Filter and sort BRDs
  const filteredBRDs = useMemo(() => {
    let result = [...brds];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(brd =>
        brd.title?.toLowerCase().includes(term) ||
        brd.content?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(brd => brd.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'title':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'version':
        result.sort((a, b) => (b.version || 1) - (a.version || 1));
        break;
    }

    return result;
  }, [brds, searchTerm, filterStatus, sortBy]);

  const handleGenerateBRD = async () => {
    if (generateForm.selectedStories.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one story' });
      return;
    }

    try {
      setGenerating(true);
      setStatus({ type: 'info', message: '🤖 Generating BRD with AI...' });

      // Ensure story_ids are integers
      const storyIds = generateForm.selectedStories.map(id => {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return numId;
      }).filter(id => !isNaN(id) && id > 0);

      if (storyIds.length === 0) {
        setStatus({ type: 'error', message: 'Invalid story selection' });
        setGenerating(false);
        return;
      }

      const response = await api.post('/brd/generate', {
        story_ids: storyIds,
        title: generateForm.title || undefined,
        template: generateForm.template,
      });

      const brd = response.data?.data;
      if (brd) {
        setBRDs(prev => [brd, ...prev]);
        setStatus({ type: 'success', message: '✅ BRD generated successfully!' });
        setGenerateModal(false);
        setGenerateForm({
          selectedStories: [],
          title: '',
          template: 'full',
          useAiStories: true,
        });
      }
    } catch (err) {
      console.error('Error generating BRD:', err);
      const msg = err.response?.data?.error || 'Failed to generate BRD. Check AI configuration.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateBRD = async () => {
    if (!editModal.brd) return;

    try {
      setSaving(true);
      await api.put(`/brd/${editModal.brd.id}`, {
        title: editForm.title,
        content: editForm.content,
      });

      setBRDs(prev => prev.map(b =>
        b.id === editModal.brd.id
          ? { ...b, title: editForm.title, content: editForm.content, version: (b.version || 1) + 1 }
          : b
      ));

      setStatus({ type: 'success', message: 'BRD updated successfully!' });
      setEditModal({ open: false, brd: null });
    } catch (err) {
      console.error('Error updating BRD:', err);
      setStatus({ type: 'error', message: 'Failed to update BRD' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBRD = async () => {
    if (!deleteConfirm.brdId) return;

    try {
      await api.delete(`/brd/${deleteConfirm.brdId}`);
      setBRDs(prev => prev.filter(b => b.id !== deleteConfirm.brdId));
      setStatus({ type: 'success', message: 'BRD deleted successfully!' });
      setDeleteConfirm({ open: false, brdId: null });
    } catch (err) {
      console.error('Error deleting BRD:', err);
      setStatus({ type: 'error', message: 'Failed to delete BRD' });
    }
  };

  const handleExportPDF = async (brdId) => {
    try {
      setStatus({ type: 'info', message: 'Generating PDF...' });
      const response = await api.post(`/brd/${brdId}/export-pdf`, {}, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BRD_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatus({ type: 'success', message: 'PDF downloaded!' });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setStatus({ type: 'error', message: 'Failed to export PDF' });
    }
  };

  const handleExportText = async (brdId) => {
    try {
      const response = await api.get(`/brd/${brdId}/export-text`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BRD_${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatus({ type: 'success', message: 'Text file downloaded!' });
    } catch (err) {
      console.error('Error exporting text:', err);
      setStatus({ type: 'error', message: 'Failed to export text' });
    }
  };

  const handleViewVersions = async (brdId) => {
    try {
      const response = await api.get(`/brd/${brdId}/versions`);
      setVersionsModal({
        open: true,
        brdId,
        versions: response.data?.data || [],
      });
    } catch (err) {
      console.error('Error fetching versions:', err);
      setStatus({ type: 'error', message: 'Failed to load version history' });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ type: 'success', message: 'Copied to clipboard!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to copy' });
    }
  };

  const openEditModal = (brd) => {
    setEditForm({
      title: brd.title || '',
      content: brd.content || '',
    });
    setEditModal({ open: true, brd });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStories = () => generateForm.useAiStories ? aiStories : userStories;

  const toggleStorySelection = (storyId) => {
    setGenerateForm(prev => ({
      ...prev,
      selectedStories: prev.selectedStories.includes(storyId)
        ? prev.selectedStories.filter(id => id !== storyId)
        : [...prev.selectedStories, storyId],
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <FileText size={24} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">Business Requirements Documents</h1>
                </div>
                <p className="text-gray-600 ml-11">Generate, edit, and manage BRDs with AI-powered assistance.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchBRDs}
                  className="btn flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  disabled={loading}
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>

                <button
                  onClick={() => setGenerateModal(true)}
                  className="btn flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Sparkles size={20} />
                  Generate BRD
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {status && (
              <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] p-4 rounded-lg border-l-4 text-sm font-medium transition-all duration-300 shadow-2xl max-w-md ${status.type === 'error'
                ? 'border-l-red-500 bg-red-50 text-red-700 border border-red-200'
                : status.type === 'info'
                  ? 'border-l-blue-500 bg-blue-50 text-blue-700 border border-blue-200'
                  : 'border-l-green-500 bg-green-50 text-green-700 border border-green-200'
                }`}>
                <div className="flex items-start gap-3">
                  {status.type === 'error' ? (
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  ) : status.type === 'info' ? (
                    <Sparkles size={20} className="flex-shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <Check size={20} className="flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">{status.message}</div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search BRDs by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="review">In Review</option>
                    <option value="approved">Approved</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-white"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="title">By Title</option>
                    <option value="version">By Version</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total BRDs</p>
                <p className="text-2xl font-bold text-gray-900">{brds.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">{brds.filter(b => b.status === 'draft').length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">In Review</p>
                <p className="text-2xl font-bold text-blue-600">{brds.filter(b => b.status === 'review').length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{brds.filter(b => b.status === 'approved').length}</p>
              </div>
            </div>

            {/* BRD List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading BRDs...</p>
                </div>
              </div>
            ) : filteredBRDs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText size={32} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No BRDs found' : 'No BRDs yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Generate your first BRD from user stories'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setGenerateModal(true)}
                    className="btn inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all"
                  >
                    <Sparkles size={20} />
                    Generate First BRD
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBRDs.map((brd) => (
                  <div
                    key={brd.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Card Header */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedBRD(expandedBRD === brd.id ? null : brd.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{brd.title}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              v{brd.version || 1}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${brd.status === 'approved' ? 'bg-green-100 text-green-700' :
                              brd.status === 'review' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {brd.status || 'draft'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{brd.content?.substring(0, 200)}...</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Created: {formatDate(brd.created_at)}
                            </span>
                            {brd.updated_at && brd.updated_at !== brd.created_at && (
                              <span className="flex items-center gap-1">
                                <Edit2 size={14} />
                                Updated: {formatDate(brd.updated_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, brd }); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(brd); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExportPDF(brd.id); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Export PDF"
                          >
                            <Download size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewVersions(brd.id); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Version History"
                          >
                            <History size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, brdId: brd.id }); }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                          <div className="ml-2">
                            {expandedBRD === brd.id ? (
                              <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={20} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedBRD === brd.id && (
                      <div className="border-t border-gray-200 p-5 bg-gray-50">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                            {brd.content}
                          </pre>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => copyToClipboard(brd.content)}
                            className="btn flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 text-sm"
                          >
                            <Copy size={16} />
                            Copy Content
                          </button>
                          <button
                            onClick={() => handleExportText(brd.id)}
                            className="btn flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 text-sm"
                          >
                            <FileDown size={16} />
                            Export as Text
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Generate BRD Modal */}
      <Modal isOpen={generateModal} onClose={() => setGenerateModal(false)} title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles size={24} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate BRD with AI</h2>
            <p className="text-sm text-gray-500 font-normal">Select stories to generate a comprehensive BRD</p>
          </div>
        </div>
      }>
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BRD Title (optional)</label>
            <input
              type="text"
              placeholder="Auto-generated if empty"
              value={generateForm.title}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              value={generateForm.template}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, template: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            >
              <option value="full">📄 Full BRD</option>
              <option value="executive">📊 Executive Summary</option>
              <option value="technical">🔧 Technical Specification</option>
              <option value="user-focused">👤 User-Focused</option>
            </select>
          </div>

          {/* Story Source Toggle */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Story Source:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGenerateForm(prev => ({ ...prev, useAiStories: true, selectedStories: [] }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${generateForm.useAiStories
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
              >
                AI Stories ({aiStories.length})
              </button>
              <button
                type="button"
                onClick={() => setGenerateForm(prev => ({ ...prev, useAiStories: false, selectedStories: [] }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!generateForm.useAiStories
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
              >
                User Stories ({userStories.length})
              </button>
            </div>
          </div>

          {/* Story Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stories ({generateForm.selectedStories.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
              {getStories().length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No stories available</p>
              ) : (
                getStories().map(story => (
                  <label
                    key={story.id}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${generateForm.selectedStories.includes(story.id) ? 'bg-purple-50' : ''
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={generateForm.selectedStories.includes(story.id)}
                      onChange={() => toggleStorySelection(story.id)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{story.title}</p>
                      <p className="text-xs text-gray-500 truncate">{story.description?.substring(0, 60)}...</p>
                    </div>
                    {story.priority && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${story.priority === 'P1' ? 'bg-red-100 text-red-700' :
                        story.priority === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {story.priority}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setGenerateModal(false)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
              disabled={generating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateBRD}
              disabled={generating || generateForm.selectedStories.length === 0}
              className="px-6 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate BRD
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* View BRD Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, brd: null })}
        title={viewModal.brd?.title || 'View BRD'}
      >
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              v{viewModal.brd?.version || 1}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {viewModal.brd?.status || 'draft'}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
              {viewModal.brd?.content}
            </pre>
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => copyToClipboard(viewModal.brd?.content)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Copy size={16} />
              Copy
            </button>
            <button
              onClick={() => handleExportPDF(viewModal.brd?.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={() => { setViewModal({ open: false, brd: null }); openEditModal(viewModal.brd); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 ml-auto"
            >
              <Edit2 size={16} />
              Edit
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit BRD Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, brd: null })}
        title="Edit BRD"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              rows={15}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setEditModal({ open: false, brd: null })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateBRD}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, brdId: null })}
        title="Delete BRD"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Are you sure you want to delete this BRD?</p>
            <p className="text-red-600 text-sm mt-1">This action cannot be undone. All versions will be permanently deleted.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm({ open: false, brdId: null })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBRD}
              className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={versionsModal.open}
        onClose={() => setVersionsModal({ open: false, brdId: null, versions: [] })}
        title="Version History"
      >
        <div className="space-y-4">
          {versionsModal.versions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No version history available</p>
          ) : (
            <div className="space-y-2">
              {versionsModal.versions.map((version, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                      v{version.version_number}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(version.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
