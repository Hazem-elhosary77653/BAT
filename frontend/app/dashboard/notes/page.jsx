'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, Search, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', color: '#ffffff' });
    const { toast: toastData, success, error: showError, close: closeToast } = useToast();

    const colors = [
        { name: 'White', value: '#ffffff' },
        { name: 'Yellow', value: '#fef3c7' },
        { name: 'Blue', value: '#dbeafe' },
        { name: 'Green', value: '#dcfce7' },
        { name: 'Red', value: '#fee2e2' },
        { name: 'Purple', value: '#f3e8ff' },
    ];

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await api.get('/notes');
            setNotes(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notes:', error);
            showError('Failed to load notes');
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
        if (!formData.title.trim() && !formData.content.trim()) {
            showError('Note cannot be empty');
            return;
        }

        try {
            if (editingNote) {
                await api.put(`/notes/${editingNote.id}`, formData);
                success('Note updated successfully');
            } else {
                await api.post('/notes', formData);
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

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen relative">
            {/* Toast System */}
            {toastData && (
                <Toast
                    message={toastData.message}
                    type={toastData.type}
                    duration={toastData.duration}
                    onClose={closeToast}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personal Notes</h1>
                    <p className="text-slate-500 text-sm font-medium">Keep your thoughts organized</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    <Plus size={20} />
                    New Note
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            className="group relative p-6 rounded-3xl border border-slate-200 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                            style={{ backgroundColor: note.color }}
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(note)}
                                    className="p-2 bg-white/80 backdrop-blur-sm rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="p-2 bg-white/80 backdrop-blur-sm rounded-xl text-slate-600 hover:text-red-600 hover:bg-white transition-all shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="font-black text-slate-900 mb-3 truncate pr-16">{note.title || 'Untitled Note'}</h3>
                            <p className="text-slate-600 text-sm line-clamp-6 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            <div className="mt-4 pt-4 border-t border-slate-900/5 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(note.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No notes found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">Start capturing your brilliance by creating your first note.</p>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900">
                                {editingNote ? 'Edit Note' : 'Create Note'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter title..."
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Start typing..."
                                    rows={8}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Background Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all ${formData.color === color.value ? 'border-indigo-600 scale-110 shadow-lg' : 'border-slate-200 hover:scale-105'}`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 px-6 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-white hover:border-slate-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {editingNote ? 'Update Note' : 'Save Note'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesPage;
