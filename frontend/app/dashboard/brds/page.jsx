"use client";

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
  AlertCircle, Filter, History, X, FileDown, ChevronRight, Share2, Users, UserPlus,
  ShieldCheck, Zap, Info, Target, TrendingUp, GitCompare, ListChecks, BookOpen, Layout
} from 'lucide-react';

export default function BRDsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // State
  const [brds, setBRDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [expandedBRD, setExpandedBRD] = useState(null);

  // Status messages
  const [status, setStatus] = useState(null);

  // Derived: filter and sort BRDs for listing
  const filteredBRDs = useMemo(() => {
    let list = Array.isArray(brds) ? [...brds] : [];
    const term = (searchTerm || '').trim().toLowerCase();
    if (term) {
      list = list.filter(b => (b.title || '').toLowerCase().includes(term) || (b.content || '').toLowerCase().includes(term));
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter(b => (b.status || 'draft') === filterStatus);
    }
    switch (sortBy) {
      case 'date-asc':
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'title':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'version':
        list.sort((a, b) => (b.version || 0) - (a.version || 0));
        break;
      case 'date-desc':
      default:
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }
    return list;
  }, [brds, searchTerm, filterStatus, sortBy]);

  // Modals
  const [viewModal, setViewModal] = useState({ open: false, brd: null, activeTab: 'content' });
  const [editModal, setEditModal] = useState({ open: false, brd: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, brdId: null });
  const [versionsModal, setVersionsModal] = useState({ open: false, brdId: null, versions: [] });
  const [compareModal, setCompareModal] = useState({ open: false, v1: null, v2: null, content1: '', content2: '' });

  // Side-by-side diff to highlight version changes per line
  const diffView = useMemo(() => {
    const a = (compareModal.content1 || '').split(/\r?\n/);
    const b = (compareModal.content2 || '').split(/\r?\n/);
    const max = Math.max(a.length, b.length);
    const left = [];
    const right = [];
    for (let i = 0; i < max; i++) {
      const al = a[i] ?? '';
      const bl = b[i] ?? '';
      let status = 'same';
      if (al === bl) status = 'same';
      else if (al && !bl) status = 'removed';
      else if (!al && bl) status = 'added';
      else status = 'changed';
      left.push({ text: al, status });
      right.push({ text: bl, status });
    }
    return { left, right };
  }, [compareModal.content1, compareModal.content2]);

  // Utilities
  const formatDate = (d) => new Date(d).toLocaleString();

  // Utilities and data
  const fetchBRDs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/brd');
      setBRDs(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching BRDs:', err);
      setStatus({ type: 'error', message: 'Failed to load BRDs' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBRDs();
  }, []);
  const handleDeleteBRD = async () => {
    try {
      if (!deleteConfirm.brdId) return;
      await api.delete(`/brd/${deleteConfirm.brdId}`);
      setBRDs(prev => prev.filter(b => b.id !== deleteConfirm.brdId));
      setStatus({ type: 'success', message: 'BRD deleted successfully!' });
    } catch (err) {
      console.error('Error deleting BRD:', err);
      setStatus({ type: 'error', message: 'Failed to delete BRD' });
    } finally {
      setDeleteConfirm({ open: false, brdId: null });
    }
  };

  const handleExportPDF = async (brdId) => {
    try {
      setStatus({ type: 'info', message: 'Generating PDF...' });
      const response = await api.post(`/brd/${brdId}/export-pdf`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `BRD_${Date.now()}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      setStatus({ type: 'success', message: 'PDF downloaded!' });
    } catch (err) { console.error('Error exporting PDF:', err); setStatus({ type: 'error', message: 'Failed to export PDF' }); }
  };
  const handleExportText = async (brdId) => {
    try {
      const response = await api.post(`/brd/${brdId}/export-text`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `BRD_${Date.now()}.txt`);
      document.body.appendChild(link); link.click(); link.remove();
      setStatus({ type: 'success', message: 'Text file downloaded!' });
    } catch (err) { console.error('Error exporting text:', err); setStatus({ type: 'error', message: 'Failed to export text' }); }
  };

  const handleViewVersions = async (brdId) => {
    try { const response = await api.get(`/brd/${brdId}/versions`); setVersionsModal({ open: true, brdId, versions: response.data?.data || [] }); }
    catch (err) { console.error('Error fetching versions:', err); setStatus({ type: 'error', message: 'Failed to load version history' }); }
  };
  const handleFetchVersionForCompare = async (brdId, version, slot) => {
    try {
      const response = await api.get(`/brd/${brdId}/versions/${version}`);
      if (slot === 1) setCompareModal(p => ({ ...p, v1: version, content1: response.data?.data?.content || '' }));
      else setCompareModal(p => ({ ...p, v2: version, content2: response.data?.data?.content || '' }));
    } catch (err) { console.error('Error loading version content:', err); }
  };

  const [analysisModal, setAnalysisModal] = useState({ open: false, data: null, loading: false });
  const handleAnalyzeBRD = async (brdId) => {
    try {
      setAnalysisModal({ open: true, data: null, loading: true });
      const response = await api.post(`/brd/${brdId}/analyze`, {});
      setAnalysisModal({ open: true, data: response.data?.data || null, loading: false });
    } catch (err) {
      console.error('Error analyzing BRD:', err);
      setAnalysisModal({ open: true, data: null, loading: false });
      setStatus({ type: 'error', message: 'Failed to analyze BRD' });
    }
  };

  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const openEditModal = (brd) => { setEditForm({ title: brd?.title || '', content: brd?.content || '' }); setEditModal({ open: true, brd }); };
  const handleUpdateBRD = async () => {
    try { if (!editModal.brd?.id) return; setSaving(true); await api.put(`/brd/${editModal.brd.id}`, { title: editForm.title, content: editForm.content }); setStatus({ type: 'success', message: 'BRD updated' }); setEditModal({ open: false, brd: null }); fetchBRDs(); }
    catch (err) { console.error('Error updating BRD:', err); setStatus({ type: 'error', message: 'Failed to update BRD' }); }
    finally { setSaving(false); }
  };

  const [extracting, setExtracting] = useState(false);
  const handleExtractStories = async (brdId) => {
    try { setExtracting(true); await api.post(`/brd/${brdId}/extract-stories`, {}); setStatus({ type: 'success', message: 'Stories extraction triggered' }); }
    catch (err) { console.error('Error extracting stories:', err); setStatus({ type: 'error', message: 'Failed to extract stories' }); }
    finally { setExtracting(false); }
  };

  const handleShareBRD = (brd) => {
    try { const url = `${window.location.origin}/share/${brd?.id}`; navigator.clipboard.writeText(url); setStatus({ type: 'success', message: 'Share link copied' }); }
    catch { setStatus({ type: 'error', message: 'Failed to copy share link' }); }
  };



  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text || ''); setStatus({ type: 'success', message: 'Copied to clipboard' }); }
    catch { setStatus({ type: 'error', message: 'Copy failed' }); }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-[13px] md:text-[14px]">
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
                  onClick={() => router.push('/dashboard/brds/create')}
                  className="btn flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
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
                    onClick={() => router.push('/dashboard/brds/create')}
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

      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, brd: null, activeTab: 'content' })}
        title={
          <div className="flex items-center gap-4 w-full">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <BookOpen size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">{viewModal.brd?.title || 'Blueprint Viewer'}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol v{viewModal.brd?.version || 1.0}</span>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                  <Check size={10} /> Validated Signature
                </div>
              </div>
            </div>
          </div>
        }
        size="xl"
      >
        <div className="flex flex-col gap-6 h-[78vh]">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
            {[
              { id: 'content', label: 'Blueprint', icon: BookOpen },
              { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
              { id: 'history', label: 'Revision History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewModal(prev => ({ ...prev, activeTab: tab.id }))}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${viewModal.activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                <tab.icon size={14} className={viewModal.activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
            {/* Dynamic Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {viewModal.activeTab === 'content' && (
                <div className="flex-1 overflow-y-auto bg-white rounded-3xl border border-slate-200/60 shadow-inner p-10 font-serif leading-relaxed text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-10 pb-8 border-b border-slate-100 flex justify-between items-end">
                      <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">{viewModal.brd?.title}</h1>
                        <div className="flex gap-5 text-[12px] font-bold text-slate-400">
                          <span className="flex items-center gap-2"><Clock size={16} className="text-indigo-400" /> Compiled {new Date(viewModal.brd?.created_at).toLocaleDateString()}</span>
                          <span className="w-px h-4 bg-slate-200" />
                          <span className="flex items-center gap-2 uppercase tracking-wide">ID: {viewModal.brd?.id.split('-')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-[15px] leading-8 text-slate-600">
                        {viewModal.brd?.content}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {viewModal.activeTab === 'analysis' && (
                <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-3xl border border-slate-200/60 p-8 space-y-8 animate-in zoom-in-95 duration-500">
                  {!analysisModal.data && !analysisModal.loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
                      <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
                        <Sparkles size={40} className="animate-pulse" />
                      </div>
                      <div className="max-w-xs space-y-2">
                        <h3 className="text-xl font-black text-slate-900">Intelligence Engine Offline</h3>
                        <p className="text-sm font-medium text-slate-500">Initialize AI Analysis to audit this blueprint for compliance, risks, and gaps.</p>
                      </div>
                      <button
                        onClick={() => handleAnalyzeBRD(viewModal.brd?.id)}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        <Zap size={18} /> Run Intelligence Audit
                      </button>
                    </div>
                  ) : analysisModal.loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
                      </div>
                      <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Simulating Stakeholder Reviews...</p>
                    </div>
                  ) : (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Blueprint Integrity</h4>
                            <p className="text-2xl font-black text-slate-900">Executive Analysis Summary</p>
                          </div>
                          <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-2xl font-black border-4 ${analysisModal.data.score > 80 ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600'}`}>
                            {analysisModal.data.score}%
                          </div>
                        </div>
                        <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-center gap-1 ${analysisModal.data.risk_level === 'Low' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Risk Profile</p>
                          <p className="text-xl font-black">{analysisModal.data.risk_level} Impact</p>
                        </div>
                      </div>

                      <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="flex items-center gap-3 text-slate-900 font-black uppercase text-xs tracking-widest mb-4">
                          <Info size={16} className="text-indigo-500" /> Key Observations
                        </h4>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{analysisModal.data.summary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest ml-1">Operational Strengths</h4>
                          {analysisModal.data.strengths?.map((s, i) => (
                            <div key={i} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[13px] font-bold text-emerald-800 flex gap-3">
                              <Check size={16} className="shrink-0 mt-0.5" /> {s}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1">Critical Gaps</h4>
                          {analysisModal.data.gaps?.map((g, i) => (
                            <div key={i} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[13px] font-bold text-rose-800 flex gap-3">
                              <Target size={16} className="shrink-0 mt-0.5" /> {g}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewModal.activeTab === 'history' && (
                <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-3xl border border-slate-200/60 p-8 space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <header className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Revision Timeline</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Trail & Version Control</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!compareModal.v1 || !compareModal.v2}
                        onClick={() => setCompareModal(p => ({ ...p, open: true }))}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30 flex items-center gap-2"
                      >
                        <GitCompare size={14} /> Compare Protocols
                      </button>
                    </div>
                  </header>

                  <div className="space-y-3">
                    {versionsModal.versions.length === 0 ? (
                      <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                        <p className="text-sm font-bold text-slate-400 italic">No previous revisions detected</p>
                      </div>
                    ) : (
                      versionsModal.versions.map((version, idx) => {
                        const isSelected = compareModal.v1 === version.version_number || compareModal.v2 === version.version_number;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (compareModal.v1 === version.version_number) setCompareModal(p => ({ ...p, v1: null, content1: '' }));
                              else if (compareModal.v2 === version.version_number) setCompareModal(p => ({ ...p, v2: null, content2: '' }));
                              else if (!compareModal.v1) handleFetchVersionForCompare(viewModal.brd?.id, version.version_number, 1);
                              else if (!compareModal.v2) handleFetchVersionForCompare(viewModal.brd?.id, version.version_number, 2);
                            }}
                            className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative group ${isSelected ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-100/50' : 'border-white bg-white hover:border-slate-100 shadow-sm'
                              }`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${isSelected ? 'bg-indigo-600 text-white rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                {version.version_number}
                              </div>
                              <div>
                                <p className="text-[14px] font-black text-slate-900">Protocol Release {version.version_number}.0</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatDate(version.created_at)}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-indigo-100">
                                Slot {compareModal.v1 === version.version_number ? 'A' : 'B'}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Perspective Sidebar - Always Visible Actions */}
            <div className="w-full md:w-72 flex flex-col gap-5 shrink-0">
              <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-200/60 p-6 space-y-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Deployment Hub</h4>

                <button
                  onClick={() => handleExtractStories(viewModal.brd?.id)}
                  disabled={extracting}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 group disabled:opacity-50"
                >
                  <div className="p-2.5 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
                    <ListChecks size={20} />
                  </div>
                  <span className="font-bold text-sm">Extract Intelligence</span>
                </button>

                <div className="h-px bg-slate-200 mx-2" />

                <button
                  onClick={() => handleExportPDF(viewModal.brd?.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
                >
                  <div className="p-2.5 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
                    <Download size={20} />
                  </div>
                  <span className="font-bold text-sm">Download PDF</span>
                </button>

                <button
                  onClick={() => handleShareBRD(viewModal.brd)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm group"
                >
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                    <Share2 size={20} />
                  </div>
                  <span className="font-bold text-sm">Transfer Link</span>
                </button>

                <div className="h-px bg-slate-200 mx-2" />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => copyToClipboard(viewModal.brd?.content)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all group"
                  >
                    <Copy size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Payload</span>
                  </button>
                  <button
                    onClick={() => handleExportText(viewModal.brd?.id)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all group"
                  >
                    <FileDown size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Source</span>
                  </button>
                </div>
              </div>

              <div className="mt-auto bg-slate-900 rounded-[2.5rem] p-6 space-y-4 shadow-2xl shadow-slate-200">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Edit Authority</span>
                </div>
                <button
                  onClick={() => { setViewModal(p => ({ ...p, open: false })); openEditModal(viewModal.brd); }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/5 group"
                >
                  <Edit2 size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="font-bold">Engineer Content</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        isOpen={analysisModal.open}
        onClose={() => setAnalysisModal({ open: false, data: null, loading: false })}
        title={
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" size={24} />
            <span>AI Review & Insights</span>
          </div>
        }
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {analysisModal.loading ? (
            <div className="py-12 text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-600 font-medium">Sit tight! A Senior Analyst is reviewing your document...</p>
            </div>
          ) : analysisModal.data ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${analysisModal.data.score > 80 ? 'border-emerald-500 text-emerald-600' :
                    analysisModal.data.score > 60 ? 'border-amber-500 text-amber-600' : 'border-rose-500 text-rose-600'
                    }`}>
                    {analysisModal.data.score}%
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Quality Score</h3>
                    <p className="text-sm text-slate-500">Industry standard review</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${analysisModal.data.risk_level === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                  analysisModal.data.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                  {analysisModal.data.risk_level} Risk
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="flex items-center gap-2 text-slate-900 font-bold mb-3">
                  <Info className="text-blue-500" size={18} />
                  Summary
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">{analysisModal.data.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <h4 className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                    <Check className="text-emerald-500" size={18} />
                    Strengths
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {analysisModal.data.strengths?.map((s, i) => (
                      <li key={i} className="text-emerald-700 flex items-start gap-2">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                  <h4 className="flex items-center gap-2 text-rose-800 font-bold mb-3">
                    <Target className="text-rose-500" size={18} />
                    Gaps Found
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {analysisModal.data.gaps?.map((g, i) => (
                      <li key={i} className="text-rose-700 flex items-start gap-2">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                <h4 className="flex items-center gap-2 text-amber-800 font-bold mb-3">
                  <TrendingUp className="text-amber-500" size={18} />
                  Suggestions
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {analysisModal.data.suggestions?.map((s, i) => (
                    <div key={i} className="bg-white/50 p-3 rounded-xl text-sm text-amber-900 border border-amber-200/50 flex items-start gap-3">
                      <Zap className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setAnalysisModal({ open: false, data: null, loading: false })}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit BRD Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, brd: null })}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-none">Refine Blueprint</h2>
              <p className="text-xs text-slate-500 mt-1">Manual Content Calibration</p>
            </div>
          </div>
        }
        size="xl"
      >
        <div className="flex flex-col h-[70vh] bg-white font-sans">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            <div className="space-y-2 group">
              <label className="text-[13px] font-semibold text-slate-600 ml-1 transition-colors group-focus-within:text-indigo-600">Document Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title..."
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-[14px] font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2 group flex-1 flex flex-col min-h-0">
              <label className="text-[13px] font-semibold text-slate-600 ml-1 transition-colors group-focus-within:text-indigo-600">Document Content (Markdown)</label>
              <div className="relative flex-1">
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Draft your content here..."
                  className="w-full h-full min-h-[400px] px-5 py-5 bg-slate-50/50 border border-slate-200 rounded-3xl text-[14px] font-mono leading-relaxed placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none scroll-smooth"
                />
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-400 shadow-sm pointer-events-none uppercase tracking-widest">
                  Markdown Enabled
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 mt-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Manual Edit Mode</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditModal({ open: false, brd: null })}
                className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                disabled={saving}
              >
                Discard
              </button>
              <button
                onClick={handleUpdateBRD}
                disabled={saving}
                className="min-w-[140px] px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                ) : (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Synchronize</span>
                  </>
                )}
              </button>
            </div>
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
          <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
            <Info size={14} className="text-blue-500" />
            Select two versions to compare them side-by-side.
          </p>
          {versionsModal.versions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No version history available</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {versionsModal.versions.map((version, idx) => {
                const isSelected = compareModal.v1 === version.version_number || compareModal.v2 === version.version_number;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (compareModal.v1 === version.version_number) setCompareModal(p => ({ ...p, v1: null, content1: '' }));
                      else if (compareModal.v2 === version.version_number) setCompareModal(p => ({ ...p, v2: null, content2: '' }));
                      else if (!compareModal.v1) handleFetchVersionForCompare(versionsModal.brdId, version.version_number, 1);
                      else if (!compareModal.v2) handleFetchVersionForCompare(versionsModal.brdId, version.version_number, 2);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {version.version_number}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Version {version.version_number}</p>
                        <p className="text-xs text-slate-500">{formatDate(version.created_at)}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">
                        Selected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setCompareModal(p => ({ ...p, open: true }));
                setVersionsModal(p => ({ ...p, open: false }));
              }}
              disabled={!compareModal.v1 || !compareModal.v2}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg"
            >
              <GitCompare size={18} />
              Compare Selected Versions
            </button>
          </div>
        </div>
      </Modal>

      {/* Side-by-Side Comparison Modal */}
      <Modal
        isOpen={compareModal.open}
        onClose={() => setCompareModal(p => ({ ...p, open: false }))}
        title={
          <div className="flex items-center gap-2">
            <GitCompare size={24} className="text-purple-600" />
            <span>Side-by-Side Comparison</span>
          </div>
        }
      >
        <div className="flex flex-col h-[80vh]">
          {/* Header Info */}
          <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-center flex-1">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold ring-4 ring-purple-50">Version {compareModal.v1}</span>
            </div>
            <div className="px-4 text-slate-400 font-bold">VS</div>
            <div className="text-center flex-1">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold ring-4 ring-blue-50">Version {compareModal.v2}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-2">
            <div className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700">Added</div>
            <div className="px-2 py-1 rounded-md bg-rose-50 border border-rose-100 text-rose-700">Removed</div>
            <div className="px-2 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700">Changed</div>
            <div className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600">Unchanged</div>
          </div>

          {/* Comparison View */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-500 flex items-center gap-2">
                <Clock size={14} /> OLDER VERSION
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {diffView.left.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-3 py-1.5 font-mono text-[11px] leading-relaxed ${
                      line.status === 'added'
                        ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-400'
                        : line.status === 'removed'
                          ? 'bg-rose-50 text-rose-700 border-l-2 border-rose-400'
                          : line.status === 'changed'
                            ? 'bg-amber-50 text-amber-800 border-l-2 border-amber-400'
                            : 'bg-white text-slate-700'
                    }`}
                  >
                    <span className="w-10 text-[10px] text-slate-400 select-none">{idx + 1}</span>
                    <span className="flex-1 whitespace-pre-wrap">{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-blue-50/50 border-b border-blue-100 font-bold text-xs text-blue-600 flex items-center gap-2">
                <Sparkles size={14} /> NEWER VERSION
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {diffView.right.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-3 py-1.5 font-mono text-[11px] leading-relaxed ${
                      line.status === 'added'
                        ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-400'
                        : line.status === 'removed'
                          ? 'bg-rose-50 text-rose-700 border-l-2 border-rose-400'
                          : line.status === 'changed'
                            ? 'bg-amber-50 text-amber-800 border-l-2 border-amber-400'
                            : 'bg-white text-slate-700'
                    }`}
                  >
                    <span className="w-10 text-[10px] text-slate-400 select-none">{idx + 1}</span>
                    <span className="flex-1 whitespace-pre-wrap">{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={() => setCompareModal(p => ({ ...p, open: false }))}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}
