'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, Edit3, Save, X, Search, BookOpen,
    Bold, Italic, List, ListOrdered, Sparkles,
    Type, RefreshCcw, Wand2, Edit2
} from 'lucide-react';
import api from '@/lib/api';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', color: '#ffffff' });
    const [isAiLoading, setIsAiLoading] = useState(false);
    const editorRef = useRef(null);
    const { toast: toastData, success, error: showError, close: closeToast } = useToast();

    const colors = [
        { name: 'White', value: '#ffffff' },
        { name: 'Yellow', value: '#fff9db' },
        { name: 'Blue', value: '#e7f5ff' },
        { name: 'Green', value: '#ebfbee' },
        { name: 'Red', value: '#fff5f5' },
        { name: 'Purple', value: '#f3f0ff' },
    ];

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notes');
            setNotes(response.data.data || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
            showError('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (note = null) => {
        if (note) {
            setEditingNote(note);
            setFormData({ title: note.title, content: note.content, color: note.color });
        } else {
            setEditingNote(null);
            setFormData({ title: '', content: '', color: '#ffffff' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const content = editorRef.current ? editorRef.current.innerHTML : formData.content;

        if (!formData.title.trim() && (!content || content === '<br>' || content === '')) {
            showError('Note cannot be empty');
            return;
        }

        try {
            const payload = { ...formData, content };
            if (editingNote) {
                await api.put(`/notes/${editingNote.id}`, payload);
                success('Note updated successfully');
            } else {
                await api.post('/notes', payload);
                success('Note created successfully');
            }
            setIsModalOpen(false);
            fetchNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            showError('Failed to save note');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await api.delete(`/notes/${id}`);
            success('Note deleted successfully');
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            showError('Failed to delete note');
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
    };

    const handleAiAction = async (instruction) => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        const fullText = editorRef.current ? editorRef.current.innerText : formData.content;

        const textToProcess = selectedText || fullText;

        if (!textToProcess || textToProcess.trim().length < 5) {
            showError('Please enter more text or select a part for AI to help');
            return;
        }

        setIsAiLoading(true);
        try {
            const response = await api.post('/notes/ai', {
                text: textToProcess,
                instruction: instruction
            });

            if (response.data.success) {
                if (selectedText) {
                    document.execCommand('insertHTML', false, response.data.data);
                } else {
                    if (editorRef.current) editorRef.current.innerHTML = response.data.data;
                    setFormData({ ...formData, content: response.data.data });
                }
                success('AI refinement applied');
            }
        } catch (error) {
            console.error('AI error:', error);
            showError(error.response?.data?.error || 'AI assistance failed');
        } finally {
            setIsAiLoading(false);
        }
    };

    const filteredNotes = notes.filter(note =>
        (note.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Toast System */}
                            {toastData && (
                                <Toast
                                    message={toastData.message}
                                    type={toastData.type}
                                    duration={toastData.duration}
                                    onClose={closeToast}
                                />
                            )}

                            <PageHeader
                                title="Personal Notes"
                                description="Capture ideas, refined by AI intelligence."
                                icon={Edit3}
                                actions={
                                    <button
                                        onClick={() => handleOpenModal()}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0b2b4c] text-white hover:bg-[#0b2b4c]/90 transition-all shadow-md active:scale-95 text-sm font-semibold"
                                    >
                                        <Plus size={18} />
                                        New Note
                                    </button>
                                }
                            />

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0b2b4c] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search your notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 focus:border-[#0b2b4c] transition-all shadow-sm"
                                />
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm"></div>
                                    ))}
                                </div>
                            ) : filteredNotes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredNotes.map((note, idx) => (
                                        <div
                                            key={note.id || idx}
                                            onClick={() => handleOpenModal(note)}
                                            className="group relative p-6 rounded-2xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col min-h-[250px] bg-white cursor-pointer"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: note.color }}></div>
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-bold text-gray-900 truncate pr-8 leading-tight">{note.title || 'Untitled'}</h3>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="text-gray-600 text-sm flex-1 overflow-hidden prose prose-sm line-clamp-6"
                                                dangerouslySetInnerHTML={{ __html: note.content }}
                                            />
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                                                <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                                <div className="flex items-center gap-1">
                                                    <Sparkles size={12} className="text-amber-400" />
                                                    AI Ready
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <BookOpen size={28} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No notes yet</h3>
                                    <p className="text-gray-500 mt-1 max-w-xs mx-auto text-sm">Capture your first brilliant idea and let AI help you refine it.</p>
                                    <button
                                        onClick={() => handleOpenModal()}
                                        className="mt-6 px-6 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold text-sm hover:bg-[#0b2b4c]/90 transition-all"
                                    >
                                        Create First Note
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <Edit2 size={20} className="text-[#0b2b4c]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingNote ? 'Edit Note' : 'New Note'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Note Title</label>
                                    <div className="flex gap-2">
                                        {colors.map((color) => (
                                            <button
                                                key={color.value}
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                className={`w-6 h-6 rounded-lg border-2 transition-all ${formData.color === color.value ? 'border-[#0b2b4c] scale-110 shadow-md' : 'border-white hover:scale-105 shadow-sm'}`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter title..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 focus:border-[#0b2b4c] text-xl font-bold text-gray-900 placeholder:text-gray-300"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-white rounded-xl border border-gray-200 sticky top-0 z-10 shadow-sm">
                                    <div className="flex items-center gap-1 border-r border-gray-100 pr-2">
                                        <button onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-[#0b2b4c] transition-all" title="Bold"><Bold size={18} /></button>
                                        <button onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-[#0b2b4c] transition-all" title="Italic"><Italic size={18} /></button>
                                        <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-[#0b2b4c] transition-all" title="Bullet List"><List size={18} /></button>
                                        <button onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-[#0b2b4c] transition-all" title="Numbered List"><ListOrdered size={18} /></button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleAiAction('Refine this text to be more professional and clear while maintaining the core meaning.')}
                                                disabled={isAiLoading}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-[#0b2b4c] text-white rounded-lg font-semibold text-xs transition-all hover:bg-[#0b2b4c]/90 disabled:opacity-50"
                                            >
                                                {isAiLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-400" />}
                                                Smart Refine
                                            </button>
                                            <button
                                                onClick={() => handleAiAction('Expand on these points with more detail, professional context, and structural clarity.')}
                                                disabled={isAiLoading}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-semibold text-xs transition-all hover:bg-amber-100 disabled:opacity-50"
                                            >
                                                <Wand2 size={14} />
                                                Deep Expand
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onBlur={(e) => setFormData({ ...formData, content: e.target.innerHTML })}
                                    dangerouslySetInnerHTML={{ __html: formData.content }}
                                    className="w-full min-h-[350px] p-6 rounded-xl focus:outline-none transition-all prose prose-slate max-w-none text-gray-800 leading-relaxed overflow-y-auto border border-gray-200 bg-white"
                                    placeholder="Start writing your thoughts here..."
                                    style={{ borderLeft: `6px solid ${formData.color}` }}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 sticky bottom-0 z-20">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2.5 bg-[#0b2b4c] text-white rounded-lg font-semibold text-sm shadow-md hover:bg-[#0b2b4c]/90 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Save size={18} />
                                {editingNote ? 'Save Changes' : 'Create Note'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                [contentEditable]:empty:before {
                    content: attr(placeholder);
                    color: #d1d5db;
                    font-style: italic;
                    cursor: text;
                }
                .prose *:first-child { margin-top: 0; }
                .prose { font-size: 0.95rem; }
            `}</style>
        </div>
    );
};

export default NotesPage;
