'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Plus, Trash2, Edit3, Save, X, Search, BookOpen,
    Bold, Italic, List, ListOrdered, Sparkles,
    Type, RefreshCcw, Wand2, Edit2, Pin, Star,
    Archive, Tag, Calendar, CheckSquare, Square,
    Clock, AlertCircle, Filter
} from 'lucide-react';
import api from '@/lib/api';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';

const NotesPage = () => {
    const [notes, _setNotes] = useState([]);
    const setNotes = (data) => {
        if (Array.isArray(data)) {
            const hasInvalid = data.some(n => !n || (!n.id && n.id !== 0));
            if (hasInvalid) {
                console.error('[Notes] ERROR: setNotes called with invalid data! Trace:', data);
                _setNotes(data.filter(n => n && (n.id || n.id === 0)));
                return;
            }
        }
        _setNotes(data);
    };

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        color: '#ffffff',
        is_pinned: false,
        is_favorite: false,
        is_todo: false,
        tags: [],
        priority: null,
        due_date: null,
        todo_items: []
    });
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [noteIdToDelete, setNoteIdToDelete] = useState(null);
    const [noteTitleToDelete, setNoteTitleToDelete] = useState('');
    const [currentFilter, setCurrentFilter] = useState('all'); // all, pinned, favorite, archived, todos
    const [availableTags, setAvailableTags] = useState([]);
    const [showTagInput, setShowTagInput] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [showArchived, setShowArchived] = useState(false);

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

    const priorities = [
        { name: 'High', value: 'high', color: 'text-red-600 bg-red-50' },
        { name: 'Medium', value: 'medium', color: 'text-amber-600 bg-amber-50' },
        { name: 'Low', value: 'low', color: 'text-blue-600 bg-blue-50' }
    ];

    useEffect(() => {
        fetchNotes();
        fetchTags();
    }, [showArchived]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const params = showArchived ? { archived: 'true' } : {};
            const response = await api.get('/notes', { params });
            const allNotes = response.data.data || [];

            // Parse JSON fields for SQLite
            const parsedNotes = allNotes.map(note => ({
                ...note,
                tags: note.tags ? (typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags) : [],
                todo_items: note.todo_items ? (typeof note.todo_items === 'string' ? JSON.parse(note.todo_items) : note.todo_items) : []
            }));

            const validNotes = parsedNotes.filter(n => n && (n.id || n.id === 0));
            setNotes(validNotes);
        } catch (error) {
            console.error('[Notes] fetchNotes Error:', error);
            showError('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await api.get('/notes/tags');
            setAvailableTags(response.data.data || []);
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const handleOpenModal = (note = null) => {
        if (note) {
            setEditingNote(note);
            setFormData({
                title: note.title,
                content: note.content,
                color: note.color,
                is_pinned: note.is_pinned || false,
                is_favorite: note.is_favorite || false,
                is_todo: note.is_todo || false,
                tags: note.tags || [],
                priority: note.priority || null,
                due_date: note.due_date ? note.due_date.split('T')[0] : null,
                todo_items: note.todo_items || []
            });
        } else {
            setEditingNote(null);
            setFormData({
                title: '',
                content: '',
                color: '#ffffff',
                is_pinned: false,
                is_favorite: false,
                is_todo: false,
                tags: [],
                priority: null,
                due_date: null,
                todo_items: []
            });
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
            const payload = {
                ...formData,
                content,
                due_date: formData.due_date || null
            };

            if (editingNote) {
                await api.put(`/notes/${editingNote.id}`, payload);
                success('Note updated successfully');
            } else {
                await api.post('/notes', payload);
                success('Note created successfully');
            }
            setIsModalOpen(false);
            fetchNotes();
            fetchTags();
        } catch (error) {
            console.error('Error saving note:', error);
            showError('Failed to save note');
        }
    };

    const togglePin = async (note, e) => {
        e.stopPropagation();
        try {
            await api.patch(`/notes/${note.id}/pin`);
            success(note.is_pinned ? 'Note unpinned' : 'Note pinned');
            fetchNotes();
        } catch (error) {
            showError('Failed to toggle pin');
        }
    };

    const toggleFavorite = async (note, e) => {
        e.stopPropagation();
        try {
            await api.patch(`/notes/${note.id}/favorite`);
            success(note.is_favorite ? 'Removed from favorites' : 'Added to favorites');
            fetchNotes();
        } catch (error) {
            showError('Failed to toggle favorite');
        }
    };

    const toggleArchive = async (note, e) => {
        e.stopPropagation();
        try {
            await api.patch(`/notes/${note.id}/archive`);
            success(note.is_archived ? 'Note unarchived' : 'Note archived');
            fetchNotes();
        } catch (error) {
            showError('Failed to toggle archive');
        }
    };

    const handleDelete = (note) => {
        if (!note || (!note.id && note.id !== 0)) {
            console.error('[Notes] Invalid note for deletion:', note);
            return;
        }
        setNoteIdToDelete(note.id);
        setNoteTitleToDelete(note.title || 'Untitled Note');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!noteIdToDelete && noteIdToDelete !== 0) {
            setIsDeleteModalOpen(false);
            return;
        }

        try {
            const response = await api.delete(`/notes/${noteIdToDelete}`);
            if (response.data.success) {
                success('Note deleted successfully');
                fetchNotes();
            } else {
                showError(response.data.error || 'Failed to delete note');
            }
        } catch (error) {
            console.error('[Notes] API delete error:', error);
            showError(error.response?.data?.error || 'Error occurred during deletion');
        } finally {
            setIsDeleteModalOpen(false);
            setNoteIdToDelete(null);
            setNoteTitleToDelete('');
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

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
            setNewTag('');
            setShowTagInput(false);
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
    };

    const addTodoItem = () => {
        const newTodo = { id: Date.now(), text: '', completed: false };
        setFormData({ ...formData, todo_items: [...formData.todo_items, newTodo] });
    };

    const updateTodoItem = (id, field, value) => {
        const updated = formData.todo_items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setFormData({ ...formData, todo_items: updated });
    };

    const removeTodoItem = (id) => {
        setFormData({ ...formData, todo_items: formData.todo_items.filter(item => item.id !== id) });
    };

    const filteredNotes = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return (notes || [])
            .filter(note => {
                const hasId = note && (note.id || note.id === 0);
                if (!hasId) return false;

                // Filter by view
                if (currentFilter === 'pinned' && !note.is_pinned) return false;
                if (currentFilter === 'favorite' && !note.is_favorite) return false;
                if (currentFilter === 'todos' && !note.is_todo) return false;

                // Search filter
                const matches = (note.title || '').toLowerCase().includes(term) ||
                    (note.content || '').toLowerCase().includes(term) ||
                    (note.tags || []).some(tag => tag.toLowerCase().includes(term));
                return matches;
            });
    }, [notes, currentFilter, searchTerm]);

    const getPriorityBadge = (priority) => {
        const p = priorities.find(pr => pr.value === priority);
        if (!p) return null;
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.color}`}>
                {p.name}
            </span>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <div className="max-w-7xl mx-auto space-y-6">
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
                                description="Capture ideas with tags, todos, and AI intelligence."
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

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <Filter size={18} className="text-gray-400" />
                                <button
                                    onClick={() => setCurrentFilter('all')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${currentFilter === 'all' ? 'bg-[#0b2b4c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    All Notes
                                </button>
                                <button
                                    onClick={() => setCurrentFilter('pinned')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${currentFilter === 'pinned' ? 'bg-[#0b2b4c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <Pin size={14} />
                                    Pinned
                                </button>
                                <button
                                    onClick={() => setCurrentFilter('favorite')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${currentFilter === 'favorite' ? 'bg-[#0b2b4c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <Star size={14} />
                                    Favorites
                                </button>
                                <button
                                    onClick={() => setCurrentFilter('todos')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${currentFilter === 'todos' ? 'bg-[#0b2b4c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <CheckSquare size={14} />
                                    To-Dos
                                </button>
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${showArchived ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <Archive size={14} />
                                    {showArchived ? 'Hide' : 'Show'} Archived
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0b2b4c] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search notes, tags, content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 focus:border-[#0b2b4c] transition-all shadow-sm"
                                />
                            </div>

                            {/* Notes Grid */}
                            {!isModalOpen && (loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm"></div>
                                    ))}
                                </div>
                            ) : filteredNotes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            onClick={() => handleOpenModal(note)}
                                            className={`group relative p-6 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col min-h-[250px] bg-white cursor-pointer ${note.is_pinned ? 'border-[#0b2b4c] border-2' : 'border-gray-200'}`}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: note.color }}></div>

                                            {/* Header with Icons */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 pr-2">
                                                    <h3 className="text-lg font-bold text-gray-900 truncate leading-tight">{note.title || 'Untitled'}</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {note.is_pinned && <Pin size={14} className="text-[#0b2b4c] fill-current" />}
                                                        {note.is_favorite && <Star size={14} className="text-amber-500 fill-current" />}
                                                        {note.is_archived && <Archive size={14} className="text-gray-500" />}
                                                        {note.is_todo && <CheckSquare size={14} className="text-green-600" />}
                                                        {note.priority && getPriorityBadge(note.priority)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={(e) => togglePin(note, e)}
                                                        className={`p-1.5 rounded transition-colors ${note.is_pinned ? 'text-[#0b2b4c]' : 'text-gray-400 hover:text-[#0b2b4c]'}`}
                                                        title={note.is_pinned ? 'Unpin' : 'Pin'}
                                                    >
                                                        <Pin size={16} className={note.is_pinned ? 'fill-current' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => toggleFavorite(note, e)}
                                                        className={`p-1.5 rounded transition-colors ${note.is_favorite ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                                                        title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                                    >
                                                        <Star size={16} className={note.is_favorite ? 'fill-current' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => toggleArchive(note, e)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title={note.is_archived ? 'Unarchive' : 'Archive'}
                                                    >
                                                        <Archive size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(note); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            {note.tags && note.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {note.tags.map((tag, idx) => (
                                                        <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Todo Items Preview */}
                                            {note.is_todo && note.todo_items && note.todo_items.length > 0 && (
                                                <div className="mb-3 space-y-1">
                                                    {note.todo_items.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                                            {item.completed ?
                                                                <CheckSquare size={14} className="text-green-600" /> :
                                                                <Square size={14} className="text-gray-400" />
                                                            }
                                                            <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                                                                {item.text.substring(0, 30)}{item.text.length > 30 ? '...' : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {note.todo_items.length > 3 && (
                                                        <span className="text-xs text-gray-400">+{note.todo_items.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div
                                                className="text-gray-600 text-sm flex-1 overflow-hidden prose prose-sm line-clamp-4"
                                                dangerouslySetInnerHTML={{ __html: note.content }}
                                            />

                                            {/* Footer */}
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                                                <span>{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : 'No date'}</span>
                                                <div className="flex items-center gap-3">
                                                    {note.due_date && (
                                                        <div className="flex items-center gap-1 text-orange-500">
                                                            <Clock size={12} />
                                                            {new Date(note.due_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Sparkles size={12} className="text-amber-400" />
                                                        AI
                                                    </div>
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
                                    <h3 className="text-lg font-bold text-gray-900">No notes found</h3>
                                    <p className="text-gray-500 mt-1 max-w-xs mx-auto text-sm">
                                        {searchTerm ? 'Try different keywords' : 'Create your first note with todos and tags!'}
                                    </p>
                                    <button
                                        onClick={() => handleOpenModal()}
                                        className="mt-6 px-6 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold text-sm hover:bg-[#0b2b4c]/90 transition-all"
                                    >
                                        Create First Note
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Edit/New Note Modal - ENHANCED */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingNote ? 'Edit Note' : 'New Note'}
                size="lg"
            >
                <div className="flex flex-col space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_pinned}
                                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                className="w-4 h-4 text-[#0b2b4c] rounded"
                            />
                            <Pin size={16} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Pin</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_favorite}
                                onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                                className="w-4 h-4 text-amber-500 rounded"
                            />
                            <Star size={16} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Favorite</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_todo}
                                onChange={(e) => setFormData({ ...formData, is_todo: e.target.checked })}
                                className="w-4 h-4 text-green-600 rounded"
                            />
                            <CheckSquare size={16} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">To-Do List</span>
                        </label>
                    </div>

                    {/* Title & Color */}
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

                    {/* Priority & Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 mb-2 block">Priority</label>
                            <select
                                value={formData.priority || ''}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value || null })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 text-sm"
                            >
                                <option value="">No Priority</option>
                                {priorities.map(p => (
                                    <option key={p.value} value={p.value}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 mb-2 block">Due Date</label>
                            <input
                                type="date"
                                value={formData.due_date || ''}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 text-sm"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    #{tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        {showTagInput ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                    placeholder="New tag..."
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 text-sm"
                                    autoFocus
                                />
                                <button onClick={addTag} className="px-4 py-2 bg-[#0b2b4c] text-white rounded-lg text-sm font-semibold hover:bg-[#0b2b4c]/90">
                                    Add
                                </button>
                                <button onClick={() => { setShowTagInput(false); setNewTag(''); }} className="px-3 py-2 bg-gray-200 rounded-lg">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowTagInput(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all"
                            >
                                <Tag size={14} />
                                Add Tag
                            </button>
                        )}
                    </div>

                    {/* To-Do Items */}
                    {formData.is_todo && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 mb-3 block">To-Do Items</label>
                            <div className="space-y-2 mb-3">
                                {formData.todo_items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={(e) => updateTodoItem(item.id, 'completed', e.target.checked)}
                                            className="w-4 h-4 text-green-600 rounded"
                                        />
                                        <input
                                            type="text"
                                            value={item.text}
                                            onChange={(e) => updateTodoItem(item.id, 'text', e.target.value)}
                                            placeholder="Task description..."
                                            className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0b2b4c]/20 text-sm"
                                        />
                                        <button
                                            onClick={() => removeTodoItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addTodoItem}
                                className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-all"
                            >
                                <Plus size={14} />
                                Add Task
                            </button>
                        </div>
                    )}

                    {/* Editor Toolbar */}
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

                        {/* Content Editor */}
                        <div
                            ref={editorRef}
                            contentEditable
                            onBlur={(e) => setFormData({ ...formData, content: e.target.innerHTML })}
                            dangerouslySetInnerHTML={{ __html: formData.content }}
                            className="w-full min-h-[250px] p-6 rounded-xl focus:outline-none transition-all prose prose-slate max-w-none text-gray-800 leading-relaxed overflow-y-auto border border-gray-200 bg-white"
                            placeholder="Start writing your thoughts here..."
                            style={{ borderLeft: `6px solid ${formData.color}` }}
                        />
                    </div>

                    {/* Save Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
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
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Note"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <p className="text-gray-500 text-sm">
                            Are you sure you want to delete <strong>"{noteTitleToDelete || 'this note'}"</strong>? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-red-600 transition-all active:scale-95"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

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
