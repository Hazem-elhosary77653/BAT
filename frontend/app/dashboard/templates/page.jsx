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
  Code,
  Zap,
  ShieldCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';

const CATEGORIES = [
  { id: 'brd', label: 'BRD Documents', icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'story', label: 'User Stories', icon: Layout, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'document', label: 'General Documents', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'email', label: 'Email Templates', icon: Mail, color: 'text-accent', bg: 'bg-accent/10' }
];

// Dynamic sections based on template type
const TEMPLATE_SECTIONS = {
  brd: [
    { id: 'toc', label: 'Table of Contents', description: 'Automatic indexing of the document' },
    { id: 'document_control', label: 'Document Control', description: 'Version history and ownership' },
    { id: 'exec_summary', label: 'Executive Summary', description: 'High-level project overview' },
    { id: 'stakeholders', label: 'Beneficiaries & Users', description: 'Formal table of stakeholders' },
    { id: 'process_flow', label: 'Process Flow Diagram', description: 'Visual workflow representation' },
    { id: 'functional_reqs', label: 'Functional Requirements', description: 'Core system features' },
    { id: 'use_cases', label: 'Detailed Use Cases', description: 'Action-step tables for each feature' },
    { id: 'non_functional', label: 'Non-Functional Reqs', description: 'Performance, Security, etc.' },
    { id: 'record_management', label: 'Record Management', description: 'How records are controlled' },
    { id: 'sign_off', label: 'Document Approval', description: 'Final sign-off signature section' },
    { id: 'attachments', label: 'Attachments', description: 'Supporting documents and links' }
  ],
  story: [
    { id: 'user_role', label: 'User Role', description: 'As a [type of user]' },
    { id: 'action', label: 'Action/Goal', description: 'I want to [perform action]' },
    { id: 'benefit', label: 'Benefit/Value', description: 'So that [benefit/reason]' },
    { id: 'acceptance', label: 'Acceptance Criteria', description: 'Given/When/Then conditions' },
    { id: 'priority', label: 'Priority Level', description: 'Must/Should/Could have' },
    { id: 'dependencies', label: 'Dependencies', description: 'Related stories or blockers' },
    { id: 'notes', label: 'Technical Notes', description: 'Implementation details' },
    { id: 'estimation', label: 'Estimation', description: 'Story points or time' }
  ],
  document: [
    { id: 'title', label: 'Document Title', description: 'Main heading of the document' },
    { id: 'introduction', label: 'Introduction', description: 'Overview and context' },
    { id: 'body', label: 'Main Content', description: 'Primary document content' },
    { id: 'sections', label: 'Key Sections', description: 'Important subsections' },
    { id: 'summary', label: 'Summary', description: 'Key takeaways' },
    { id: 'references', label: 'References', description: 'Sources and citations' },
    { id: 'appendix', label: 'Appendix', description: 'Additional materials' }
  ],
  email: [
    { id: 'subject', label: 'Subject Line', description: 'Email subject' },
    { id: 'greeting', label: 'Greeting', description: 'Opening salutation' },
    { id: 'opening', label: 'Opening Line', description: 'Introduction statement' },
    { id: 'body', label: 'Email Body', description: 'Main message content' },
    { id: 'cta', label: 'Call to Action', description: 'What you want recipient to do' },
    { id: 'closing', label: 'Closing', description: 'Sign-off message' },
    { id: 'signature', label: 'Signature', description: 'Sender details' }
  ]
};

const BRD_SECTIONS = TEMPLATE_SECTIONS.brd;

export default function TemplatesPage() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [status, setStatus] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    variables: [],
    selectedSections: [],
    customSections: []
  });

  const [newCustomSection, setNewCustomSection] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Automatically build content when sections change
  useEffect(() => {
    if (form.selectedSections.length > 0 || form.customSections.length > 0) {
      const currentCategory = CATEGORIES.find(c => c.id === form.category);
      const templateName = form.name || `${currentCategory?.label || 'Template'}`;
      const creatorName = user?.name || 'Authorized User';
      const currentDate = new Date().toLocaleDateString();

      // Official Header
      let newContent = `# ${templateName.toUpperCase()}\n`;
      newContent += `**Proprietary & Confidential - Official Document**\n\n`;
      newContent += `---\n\n`;

      const sections = TEMPLATE_SECTIONS[form.category] || [];
      const selectedObj = form.selectedSections.map(id => sections.find(s => s.id === id)).filter(Boolean);

      let sectionCounter = 1;

      // Special Header Sections (Document Control, TOC)
      if (form.selectedSections.includes('document_control')) {
        newContent += `## ${sectionCounter++}. DOCUMENT CONTROL\n\n`;
        newContent += `| Property | Details |\n| :--- | :--- |\n`;
        newContent += `| **Document ID** | BRD-${Math.floor(1000 + Math.random() * 9000)} |\n`;
        newContent += `| **Status** | DRAFT |\n`;
        newContent += `| **Version** | v1.0.0 |\n`;
        newContent += `| **Owner** | ${creatorName} |\n`;
        newContent += `| **Last Updated** | ${currentDate} |\n\n`;
      }

      if (form.selectedSections.includes('toc')) {
        newContent += `## ${sectionCounter++}. TABLE OF CONTENTS\n\n`;
        selectedObj.filter(s => s.id !== 'toc' && s.id !== 'document_control').forEach((s, idx) => {
          newContent += `${idx + 1}. ${s.label} ..................................................... Page {{page_no}}\n`;
        });
        newContent += `\n`;
      }

      // Executive Summary
      if (form.description && form.selectedSections.includes('exec_summary')) {
        newContent += `## ${sectionCounter++}. EXECUTIVE SUMMARY\n${form.description}\n\n`;
      }

      // Body Sections
      form.selectedSections.forEach(sectionId => {
        if (['toc', 'document_control', 'exec_summary', 'sign_off'].includes(sectionId)) return;

        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        newContent += `## ${sectionCounter++}. ${section.label.toUpperCase()}\n`;

        // Specialized Content per Section ID
        switch (sectionId) {
          case 'stakeholders':
            newContent += `| М | Entity / Person | Role & Responsibility |\n| :--- | :--- | :--- |\n| 1 | IT Department | System Hosting & Security |\n| 2 | Operations | Primary End-User Group |\n| 3 | Project Manager | Progress Monitoring |\n\n`;
            break;
          case 'process_flow':
            newContent += `\n\`\`\`mermaid\ngraph TD\n    A[Start] --> B{Condition}\n    B -- Yes --> C[Process Step]\n    B -- No --> D[End]\n    C --> D\n\`\`\`\n\n`;
            break;
          case 'use_cases':
            newContent += `### USE CASE: {{use_case_name}}\n`;
            newContent += `| Field | Description |\n| :--- | :--- |\n| **ID** | UC-01 |\n| **Goal** | Allow users to perform {{action}} |\n| **Pre-conditions** | User must be logged in |\n| **Main Flow** | 1. User clicks {{button}}\\n2. System shows {{screen}}\\n3. User enters {{data}} |\n| **Success End** | Transaction is logged |\n\n`;
            break;
          default:
            newContent += `{{${sectionId}_details}}\n\n`;
        }
      });

      // Custom Sections
      form.customSections.forEach(sectionName => {
        const safeName = sectionName.toLowerCase().replace(/\s+/g, '_');
        newContent += `## ${sectionCounter++}. ${sectionName.toUpperCase()}\n{{${safeName}_details}}\n\n`;
      });

      // Sign-off Section (Always at the end if selected)
      if (form.selectedSections.includes('sign_off')) {
        newContent += `---\n\n`;
        newContent += `## ${sectionCounter++}. DOCUMENT APPROVAL & SIGN-OFF\n\n`;
        newContent += `| Role | Name | Signature | Date |\n| :--- | :--- | :--- | :--- |\n`;
        newContent += `| **Product Owner** | {{po_name}} | ____________________ | ____/____/202X |\n`;
        newContent += `| **Business Analyst** | ${creatorName} | ____________________ | ____/____/202X |\n`;
        newContent += `| **IT Manager** | {{it_manager}} | ____________________ | ____/____/202X |\n\n`;
      }

      setForm(prev => ({ ...prev, content: newContent }));
    }
  }, [form.selectedSections, form.customSections, form.category, form.name, form.description, user]);

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

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.content.trim()) errors.content = 'Content is required';
    return errors;
  };

  const handleSubmit = async (e, { closeAfter = true, asDraft = false } = {}) => {
    if (e) e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      const payload = { ...form, is_public: asDraft ? false : form.is_public };

      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, payload);
        setStatus({ type: 'success', message: 'Template updated successfully!' });
      } else {
        await api.post('/templates', payload);
        setStatus({ type: 'success', message: 'Template created successfully!' });
      }

      if (closeAfter) {
        setIsModalOpen(false);
        resetForm();
      }
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to save template' });
    } finally {
      setSaving(false);
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
      variables: template.variables || [],
      selectedSections: [], // In real app, we could parse content to find these
      customSections: []
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
      variables: [],
      selectedSections: [],
      customSections: []
    });
    setNewCustomSection('');
  };

  const toggleSection = (sectionId) => {
    setForm(prev => ({
      ...prev,
      selectedSections: prev.selectedSections.includes(sectionId)
        ? prev.selectedSections.filter(id => id !== sectionId)
        : [...prev.selectedSections, sectionId]
    }));
  };

  const addCustomSection = () => {
    if (!newCustomSection.trim()) return;
    setForm(prev => ({
      ...prev,
      customSections: [...prev.customSections, newCustomSection]
    }));
    setNewCustomSection('');
  };

  const removeCustomSection = (sectionName) => {
    setForm(prev => ({
      ...prev,
      customSections: prev.customSections.filter(s => s !== sectionName)
    }));
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
                            {String(template.user_id) === String(user?.id) && (
                              <>
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
                              </>
                            )}
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
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-surface)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-bold text-[var(--color-text)]">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-[var(--color-surface-strong)] rounded-lg"><X size={20} /></button>
              </div>
              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Template Name *</label>
                    <input type="text" className="input" placeholder="Enter template name..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {formErrors.name && <p className="text-xs text-danger mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, selectedSections: [], content: '' })}>
                      {CATEGORIES.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Access</label>
                    <select className="input" value={form.is_public ? 'public' : 'private'} onChange={(e) => setForm({ ...form, is_public: e.target.value === 'public' })}>
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description</label>
                  <textarea className="input min-h-[80px] resize-none" placeholder="Template description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                {/* Section Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="label mb-0">Select Sections</label>
                    <span className="badge">{form.selectedSections.length} selected</span>
                  </div>
                  <div className="bg-[var(--color-surface-strong)] border border-[var(--color-border)] rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto">
                      {(TEMPLATE_SECTIONS[form.category] || []).map(section => (
                        <label key={section.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${form.selectedSections.includes(section.id) ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-white border-[var(--color-border)] hover:border-primary/50'}`}>
                          <input type="checkbox" checked={form.selectedSections.includes(section.id)} onChange={() => toggleSection(section.id)} className="w-4 h-4 rounded text-primary" />
                          {section.label}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                      <input type="text" className="input flex-1" placeholder="Add custom section..." value={newCustomSection} onChange={(e) => setNewCustomSection(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSection())} />
                      <button type="button" onClick={addCustomSection} className="btn btn-primary"><Plus size={18} /></button>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="label mb-0">Live Document Preview</label>
                    <span className="badge bg-primary/10 text-primary border-primary/20">{form.variables.length} AI Variables</span>
                  </div>
                  <div className="bg-slate-100 border border-[var(--color-border)] rounded-xl p-6 flex justify-center overflow-hidden h-[400px]">
                    <div className="w-full max-w-[500px] h-full overflow-y-auto bg-white shadow-2xl border border-slate-200 p-8 custom-scrollbar relative">
                      {/* Paper Texture Overlay */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>

                      {form.content ? (
                        <div className="relative z-10">
                          <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed selection:bg-primary/20">
                            {form.content}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                          <Sparkles size={32} className="text-slate-300 mb-2 animate-pulse" />
                          <p className="text-sm text-slate-400 font-medium">Select sections to generate the official document</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)]">
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-outline">Cancel</button>
                <button disabled={saving} onClick={(e) => handleSubmit(e)} className="btn btn-primary flex items-center gap-2">
                  {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={16} />}
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        <Modal
          isOpen={!!viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          title={viewingTemplate?.name || 'Document Preview'}
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-8 flex justify-center overflow-hidden max-h-[70vh]">
              <div className="w-full max-w-[600px] bg-white shadow-2xl border border-slate-200 p-10 overflow-y-auto custom-scrollbar relative">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>

                <div className="relative z-10">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {viewingTemplate?.content}
                  </pre>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Metadata</span>
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary/10 text-primary border-primary/20">
                    {CATEGORIES.find(c => c.id === viewingTemplate?.category)?.label || 'Template'}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {viewingTemplate?.variables?.length || 0} Dynamic Variables
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Access Control</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${viewingTemplate?.is_public ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                  {viewingTemplate?.is_public ? 'Public Document' : 'Private Access'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingTemplate.content);
                  setStatus({ type: 'success', message: 'Official content copied to clipboard!' });
                }}
                className="btn btn-outline flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Source
              </button>
              <button
                onClick={() => setViewingTemplate(null)}
                className="btn btn-primary px-8"
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
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg font-semibold transition-all"
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
    </div >
  );
}
