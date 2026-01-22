'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  Upload,
  X,
  Share2,
  Lock,
  Globe,
  Tag as TagIcon,
  ChevronRight,
  Brain,
  History,
  Workflow,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
  Check,
  Clock
} from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);

  // AI Extraction State
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractionType, setExtractionType] = useState(null);
  const [savingInsight, setSavingInsight] = useState(false);

  // Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    tags: '',
    accessLevel: 'private'
  });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, documentId: null, title: '' });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      showStatus('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocDetails = async (id) => {
    try {
      const res = await api.get(`/documents/${id}/content`);
      setSelectedDoc(res.data);
    } catch (err) {
      showStatus('error', 'Failed to fetch document content');
    }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 5000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadData(prev => ({ ...prev, title: file.name.split('.')[0] }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('accessLevel', uploadData.accessLevel);

    const tagsArr = uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(tagsArr));

    try {
      console.log('[Documents] Starting upload for:', uploadData.title);
      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 1 minute timeout for uploads/extraction
      });
      console.log('[Documents] Upload successful:', res.data);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadData({ title: '', description: '', tags: '', accessLevel: 'private' });
      showStatus('success', 'Document uploaded and analyzed successfully');
      fetchDocuments();
    } catch (err) {
      console.error('[Documents] Upload error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to upload document';
      showStatus('error', `Upload Failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id, title) => {
    setDeleteConfirm({ open: true, documentId: id, title: title || 'this document' });
  };

  const confirmDelete = async () => {
    const { documentId } = deleteConfirm;
    setDeleteConfirm({ open: false, documentId: null, title: '' });
    try {
      await api.delete(`/documents/${documentId}`);
      showStatus('success', 'Document deleted successfully');
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      if (selectedDoc?.id === documentId) setSelectedDoc(null);
    } catch (err) {
      showStatus('error', 'Failed to delete');
    }
  };

  const handleExtract = async (type) => {
    if (!selectedDoc) return;
    setExtractionLoading(true);
    setExtractionType(type);
    setExtractionResult(null);
    try {
      const res = await api.post(`/documents/${selectedDoc.id}/extract`, { type });
      setExtractionResult(res.data.data);
    } catch (err) {
      showStatus('error', err.response?.data?.error || 'Extraction failed');
    } finally {
      setExtractionLoading(false);
    }
  };

  const handleSaveInsight = async () => {
    if (!selectedDoc || !extractionResult) return;
    setSavingInsight(true);
    try {
      await api.post(`/documents/${selectedDoc.id}/save-insight`, {
        type: extractionType,
        data: extractionResult
      });
      showStatus('success', `${extractionType.toUpperCase()} saved and linked successfully`);
      setExtractionResult(null);
      setExtractionType(null);
      // Refresh doc details to update linked assets count
      fetchDocDetails(selectedDoc.id);
    } catch (err) {
      showStatus('error', 'Failed to save insight');
    } finally {
      setSavingInsight(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter out any slate/indigo classes that escaped multi-replace and replace with gray/brand
  // (Manual search revealed some lingering ones)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                    <FileText size={24} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">Documents Workspace</h1>
                </div>
                <p className="text-gray-600 ml-11">Transform reference documents into actionable product assets.</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                <Plus size={20} />
                <span>Upload Document</span>
              </button>
            </div>

            {/* Status Bar */}
            {status && (
              <div className={`p-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                <div className="flex items-center gap-3">
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="text-sm font-bold">{status.message}</span>
                </div>
                <button onClick={() => setStatus(null)} className="opacity-50 hover:opacity-100"><X size={16} /></button>
              </div>
            )}

            {/* Search and Main Content Area */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search repository by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: List */}
              <div className={selectedDoc ? 'lg:col-span-4' : 'lg:col-span-12'}>
                {loading ? (
                  <div className="space-y-4 py-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-100/50 animate-pulse rounded-xl w-full" />
                    ))}
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="p-4 bg-indigo-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-indigo-600">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-500 mb-6">Upload your first document to start extracting AI insights.</p>
                  </div>
                ) : (
                  <div className={`grid gap-6 ${selectedDoc ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} w-full`}>
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          fetchDocDetails(doc.id);
                          setIsAnalysisMode(false);
                          setExtractionResult(null);
                        }}
                        className={`group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${selectedDoc?.id === doc.id
                          ? 'border-indigo-500 ring-4 ring-indigo-500/10'
                          : 'border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
                          }`}
                      >
                        {/* Status/Type Banner */}
                        <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${selectedDoc?.id === doc.id ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-300'}`} />

                        <div className="p-6">
                          <div className="flex flex-col gap-4">
                            {/* Header Info */}
                            <div className="flex items-start justify-between">
                              <div className={`p-3 rounded-xl transition-colors duration-300 ${selectedDoc?.id === doc.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600'}`}>
                                <FileText size={24} />
                              </div>
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${doc.access_level === 'private' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {doc.access_level}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.title); }}
                                  className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Text Content */}
                            <div>
                              <h3 className={`text-base font-bold text-gray-900 mb-1 leading-tight line-clamp-1 transition-colors duration-300 ${selectedDoc?.id === doc.id ? 'text-indigo-600' : ''}`}>
                                {doc.title}
                              </h3>
                              <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed h-8">
                                {doc.description || "No description provided."}
                              </p>
                            </div>

                            {/* Footer/Metadata */}
                            <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Clock size={12} className="text-gray-300" />
                                {new Date(doc.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-600/60 uppercase tracking-tighter">
                                  {doc.file_type?.split('/')[1] || 'PDF'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Overlay for Selection */}
                        {selectedDoc?.id === doc.id && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Workspace */}
              {selectedDoc && (
                <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
                    {/* Workspace Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0b2b4c]/5 text-[#0b2b4c] rounded-lg flex items-center justify-center shadow-inner">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedDoc.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] h-5 border-gray-200 text-gray-500 uppercase font-bold tracking-widest px-2">
                              {selectedDoc.file_type?.split('/')[1] || 'DOC'}
                            </Badge>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">•</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                              {selectedDoc.access_level === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                              {selectedDoc.access_level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsAnalysisMode(!isAnalysisMode);
                            setExtractionResult(null);
                          }}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isAnalysisMode
                            ? 'bg-gray-800 text-white'
                            : 'bg-indigo-600 text-white'
                            }`}
                        >
                          <Brain size={16} />
                          {isAnalysisMode ? 'Back to Content' : 'Analyze with AI'}
                        </button>
                        <button
                          onClick={() => setSelectedDoc(null)}
                          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Workspace Body */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {!isAnalysisMode ? (
                        /* Content Viewing Mode */
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 custom-scrollbar">
                          <div className="max-w-4xl mx-auto space-y-10">
                            {/* Description Card */}
                            {selectedDoc.description && (
                              <section>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                                  <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                  Document Summary
                                </h4>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 text-gray-600 leading-relaxed text-sm font-medium shadow-sm">
                                  {selectedDoc.description}
                                </div>
                              </section>
                            )}

                            {/* Extracted Content or PDF Preview */}
                            <section>
                              <div className="flex items-center justify-between mb-4 px-2">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                  {selectedDoc.file_type?.includes('pdf') ? 'Interactive Viewer' : 'Extracted Content'}
                                </h4>
                                {selectedDoc.file_type?.includes('pdf') && (
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] font-bold">
                                    Full PDF Mode
                                  </Badge>
                                )}
                              </div>

                              {selectedDoc.file_type?.includes('pdf') && selectedDoc.id ? (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[600px] relative group">
                                  <iframe
                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/documents/${selectedDoc.id}/file?token=${localStorage.getItem('token')}`}
                                    className="w-full h-full border-none"
                                    title="PDF Preview"
                                  />
                                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/documents/${selectedDoc.id}/file?token=${localStorage.getItem('token')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg text-indigo-600 hover:bg-white transition-all flex items-center gap-2 text-xs font-bold ring-1 ring-black/5"
                                    >
                                      <ExternalLink size={14} />
                                      Full Screen
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white p-8 rounded-xl border border-gray-100 text-gray-700 leading-[1.8] text-sm min-h-[500px] whitespace-pre-wrap font-medium shadow-sm">
                                  {selectedDoc.content || 'No content could be extracted from this file.'}
                                </div>
                              )}
                            </section>

                            {/* Traceability Grid */}
                            <section className="pb-10">
                              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                Traceability Registry
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                  { label: 'User Stories', count: selectedDoc.linked_assets?.stories || 0, icon: History, color: 'blue', path: '/dashboard/stories' },
                                  { label: 'Workflows', count: selectedDoc.linked_assets?.diagrams || 0, icon: Workflow, color: 'emerald', path: '/dashboard/diagrams' },
                                  { label: 'Re-built BRDs', count: selectedDoc.linked_assets?.brds || 0, icon: Sparkles, color: 'purple', path: '/dashboard/brds' }
                                ].map((asset, i) => (
                                  <div key={i} className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 bg-${asset.color}-50 text-${asset.color}-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <asset.icon size={20} />
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">{asset.label}</div>
                                        <div className="text-xl font-bold text-gray-800 tracking-tighter leading-none">{asset.count}</div>
                                      </div>
                                    </div>
                                    <ChevronRight className="text-gray-200 group-hover:text-indigo-500" size={20} />
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        </div>
                      ) : (
                        /* AI Transformation Mode */
                        <div className="flex-1 flex overflow-hidden">
                          <div className="w-80 border-r border-gray-100 p-6 flex flex-col gap-4 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Available Transforms</h4>

                            {[
                              { id: 'stories', title: 'Extract User Stories', desc: 'Convert content into granular agile stories.', icon: History, color: 'blue' },
                              { id: 'diagram', title: 'Generate Workflow', desc: 'Visualize business logic as a diagram.', icon: Workflow, color: 'emerald' },
                              { id: 'brd', title: 'Reconstruct BRD', desc: 'Structure contents into a full BRD.', icon: Sparkles, color: 'purple' }
                            ].map((action) => (
                              <button
                                key={action.id}
                                onClick={() => handleExtract(action.id)}
                                disabled={extractionLoading}
                                className={`group flex flex-col items-start gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all text-left relative ${extractionType === action.id ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20' : ''
                                  }`}
                              >
                                <div className={`w-11 h-11 bg-${action.color}-50 text-${action.color}-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm`}>
                                  <action.icon size={22} />
                                </div>
                                <div className="space-y-1">
                                  <span className="block font-bold text-gray-900 text-[15px] tracking-tight">{action.title}</span>
                                  <span className="block text-[11px] font-semibold text-gray-500 leading-normal">{action.desc}</span>
                                </div>
                                {extractionType === action.id && extractionLoading && (
                                  <div className="absolute top-4 right-4">
                                    <Loader2 className="animate-spin text-indigo-500" size={16} />
                                  </div>
                                )}
                              </button>
                            ))}

                            <div className="mt-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                              <div className="flex items-center gap-2 mb-2.5">
                                <AlertCircle size={15} className="text-indigo-400" />
                                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Traceability Note</span>
                              </div>
                              <p className="text-[11px] text-gray-500 leading-normal font-bold">
                                All generated assets are automatically context-linked to this source document for full lifecycle tracking.
                              </p>
                            </div>
                          </div>

                          {/* Canvas / Preview */}
                          <div className="flex-1 bg-white p-8 overflow-y-auto relative custom-scrollbar">
                            {extractionLoading ? (
                              <div className="h-full flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="relative w-24 h-24 mb-8">
                                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                                  <div className="absolute inset-4 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl">
                                    <Brain className="text-white" size={32} />
                                  </div>
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">Analyzing Intelligence...</h4>
                                <p className="text-gray-500 text-sm font-bold animate-pulse tracking-wide uppercase">AI is processing {extractionType} transformation</p>
                              </div>
                            ) : extractionResult ? (
                              <div className="animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                  <div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Intelligence Preview</h3>
                                    <p className="text-gray-500 text-sm font-bold flex items-center gap-2 mt-1">
                                      <Sparkles size={14} className="text-indigo-500" />
                                      Review generated results before committing to workspace
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setExtractionResult(null)}
                                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                                    >
                                      Discard
                                    </button>
                                    <button
                                      onClick={handleSaveInsight}
                                      disabled={savingInsight}
                                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-all h-10"
                                    >
                                      {savingInsight ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                      <span>Save & Link</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 shadow-inner">
                                  {extractionType === 'stories' ? (
                                    <div className="space-y-4">
                                      {Array.isArray(extractionResult) && extractionResult.map((story, i) => (
                                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-bold text-gray-800 text-base">{story.title}</h5>
                                            <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">{story.priority}</Badge>
                                          </div>
                                          <p className="text-sm font-medium text-gray-600 leading-relaxed mb-4 italic">"{story.description}"</p>
                                          <div className="space-y-1.5">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Acceptance Criteria</div>
                                            {(story.acceptance_criteria || []).map((ac, j) => (
                                              <div key={j} className="flex gap-2 text-xs font-semibold text-gray-500 leading-snug">
                                                <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={8} strokeWidth={4} /></div>
                                                {ac}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="prose prose-slate max-w-none prose-sm font-medium leading-relaxed">
                                      {typeof extractionResult === 'string' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{extractionResult}</ReactMarkdown>
                                      ) : (
                                        <div className="p-10 text-center">
                                          <Workflow size={40} className="mx-auto text-gray-300 mb-4" />
                                          <p className="text-gray-600 font-bold">Diagram logic ready</p>
                                          <pre className="bg-slate-900 text-emerald-400 p-6 rounded-xl text-[10px] text-left mt-6 overflow-x-auto shadow-xl">
                                            {extractionResult.mermaid_code}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center py-20 grayscale opacity-40">
                                <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center mb-6 shadow-inner border border-gray-100">
                                  <Sparkles size={40} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">AI Ready for Deployment</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 font-bold text-center leading-normal">Select a transformation from the action hub on the left to begin generating product assets from your document.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Modal (Standardized) */}
          <Modal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            title="Deploy New Resource"
          >
            <div className="mb-6 -mt-2">
              <p className="text-gray-500 text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff9f1c]" />
                Upload PDF, Word, or TXT for processing
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">File Payload</label>
                  <div className="relative group">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="doc-upload"
                      required
                      accept=".pdf,.docx,.txt"
                    />
                    <label
                      htmlFor="doc-upload"
                      className="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 group-hover:border-[#ff9f1c] group-hover:bg-[#ff9f1c]/5 transition-all cursor-pointer shadow-inner"
                    >
                      <div className="w-14 h-14 bg-white text-[#0b2b4c] rounded-xl flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform border border-gray-100">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 group-hover:text-[#0b2b4c] transition-colors">
                        {uploadFile ? uploadFile.name : 'Select Data Resource'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 mt-1">Supports PDF • DOCX • TEXT</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Internal Title</label>
                    <input
                      type="text"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm bg-white shadow-sm"
                      placeholder="Enter document title"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Access Control</label>
                      <select
                        value={uploadData.accessLevel}
                        onChange={(e) => setUploadData({ ...uploadData, accessLevel: e.target.value })}
                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm bg-white appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="private">Private (Restricted)</option>
                        <option value="public">Public (Shared)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Categorization Tags</label>
                      <input
                        type="text"
                        value={uploadData.tags}
                        onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm bg-white shadow-sm"
                        placeholder="e.g. Requirement, v1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  <span>{uploading ? 'Processing Extraction...' : 'Register Resource'}</span>
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={deleteConfirm.open}
            onClose={() => setDeleteConfirm({ open: false, documentId: null, title: '' })}
            title="Delete Document"
          >
            <div className="p-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h3>
                <p className="text-gray-500 font-medium">
                  You are about to permanently delete <span className="text-gray-900 font-bold">"{deleteConfirm.title}"</span>.
                  This action cannot be undone and all linked AI insights will be lost.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ open: false, documentId: null, title: '' })}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div >
    </div >
  );
}
