'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Maximize2, Minimize2, Sparkles, AlertCircle, Edit3, Plus, ExternalLink, Save, Copy, FilePlus, Check } from 'lucide-react';
import api from '@/lib/api';
import { useProjectStore, useAuthStore } from '@/store';
import { usePathname, useRouter } from 'next/navigation';
import Modal from './Modal';

const ProjectChat = ({ projectId: propProjectId, projectName: propProjectName }) => {
    const { activeGroupId, activeGroupName } = useProjectStore();
    const { user } = useAuthStore();
    const pathname = usePathname();

    // Use props if provided, otherwise fallback to store
    const projectId = propProjectId || activeGroupId || 'all';
    const projectName = propProjectName || activeGroupName || 'All Projects';

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const router = useRouter();

    // Notes state
    const [latestNotes, setLatestNotes] = useState([]);
    const [showNotesDropdown, setShowNotesDropdown] = useState(false);
    const [showNewNoteModal, setShowNewNoteModal] = useState(false);
    const [noteFormData, setNoteFormData] = useState({ title: '', content: '' });
    const [noteLoading, setNoteLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [history, isOpen, isMinimized]);

    const fetchLatestNotes = async () => {
        try {
            const response = await api.get('/notes');
            const allNotes = response.data.data || [];
            // Filter out invalid/empty notes
            const validNotes = allNotes.filter(n => n && (n.id || n.id === 0));
            setLatestNotes(validNotes.slice(0, 3));
        } catch (error) {
            console.error('Error fetching latest notes:', error);
        }
    };

    useEffect(() => {
        fetchLatestNotes();
    }, []);

    const handleSaveNote = async (e) => {
        e.preventDefault();
        if (!noteFormData.title.trim() || !noteFormData.content.trim()) return;

        setNoteLoading(true);
        try {
            await api.post('/notes', {
                ...noteFormData,
                color: '#ffffff'
            });
            setNoteFormData({ title: '', content: '' });
            setShowNewNoteModal(false);
            fetchLatestNotes();
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setNoteLoading(false);
        }
    };

    if (!user) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || loading) return;

        const userMessage = { role: 'user', content: message };
        setHistory([...history, userMessage]);
        setMessage('');
        setLoading(true);
        setError(null);

        try {
            const response = await api.post(`/ai/project/${projectId}`, {
                message: userMessage.content,
                currentPath: pathname,
                history: history.slice(-6) // Send last 3 exchanges for context
            });

            if (response.data.success) {
                setHistory(prev => [...prev, { role: 'assistant', content: response.data.message }]);
            } else {
                throw new Error(response.data.error || 'Failed to get response');
            }
        } catch (err) {
            console.error('Chat error:', err);
            setError(err.response?.data?.error || 'Failed to connect to AI service');
            setHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please make sure your API key is configured in the AI Settings.', isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleSaveToNoteQuickly = async (content) => {
        try {
            await api.post('/notes', {
                title: 'AI Project Insight',
                content: content,
                color: '#ffffff'
            });
            fetchLatestNotes();
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-50">
                {/* Notes Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotesDropdown(!showNotesDropdown)}
                        className="h-12 w-12 rounded-full bg-white text-[var(--color-primary)] shadow-lg border border-gray-200 flex items-center justify-center hover:scale-110 transition-all group"
                        title="Quick Notes"
                    >
                        <Edit3 size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>

                    {showNotesDropdown && (
                        <>
                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotesDropdown(false)} />
                            <div className="absolute bottom-14 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                                <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Latest Notes</h4>
                                    <button
                                        onClick={() => { setShowNewNoteModal(true); setShowNotesDropdown(false); }}
                                        className="p-1 hover:bg-gray-200 rounded text-[var(--color-primary)] transition-colors"
                                        title="New Note"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {latestNotes.length > 0 ? (
                                        latestNotes.map((note, idx) => (
                                            <div
                                                key={note.id || idx}
                                                onClick={() => router.push('/dashboard/notes')}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                            >
                                                <p className="text-sm font-semibold text-gray-800 truncate">{note.title || 'Untitled'}</p>
                                                <div className="text-[11px] text-gray-500 line-clamp-1 mt-1" dangerouslySetInnerHTML={{ __html: note.content }} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-gray-400 italic">No notes found</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard/notes')}
                                    className="w-full p-2.5 text-center text-[11px] font-bold text-[var(--color-primary)] hover:bg-gray-50 border-t border-gray-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ExternalLink size={12} />
                                    View All Notes
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Chat Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 flex items-center justify-center hover:scale-110 transition-all group border-4 border-white"
                >
                    <Sparkles className="animate-pulse group-hover:rotate-12 transition-transform" size={24} />
                </button>

                {/* Inline New Note Modal */}
                {showNewNoteModal && (
                    <Modal
                        isOpen={showNewNoteModal}
                        onClose={() => setShowNewNoteModal(false)}
                        title="Quick New Note"
                    >
                        <form onSubmit={handleSaveNote} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                                <input
                                    type="text"
                                    value={noteFormData.title}
                                    onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all text-sm font-medium"
                                    placeholder="Note title..."
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Content</label>
                                <textarea
                                    value={noteFormData.content}
                                    onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all text-sm min-h-[120px] resize-none"
                                    placeholder="Write your thoughts..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewNoteModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={noteLoading || !noteFormData.title.trim() || !noteFormData.content.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-semibold text-sm hover:bg-[var(--color-primary)]/90 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                >
                                    {noteLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Note
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-96 ${isMinimized ? 'h-14' : 'h-[550px]'} bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 border border-[var(--color-border)] overflow-hidden`}>
            {/* Header */}
            <div className="p-4 bg-[var(--color-primary)] text-white flex items-center justify-between cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-none">Project Assistant</h3>
                        <p className="text-[10px] text-white/70 mt-1 truncate max-w-[180px]">{projectName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {history.length === 0 && (
                            <div className="text-center py-8 px-4">
                                <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
                                    <Sparkles size={24} />
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm">
                                    {projectId === 'all' ? 'Chat with your Workspace' : 'Ask about your project'}
                                </h4>
                                <p className="text-xs text-gray-500 mt-2">
                                    {projectId === 'all'
                                        ? 'I can answer questions regarding any user story or BRD in your entire workspace.'
                                        : 'I can answer questions regarding user stories, requirements, and BRD details in this project.'}
                                </p>
                                <div className="mt-4 grid grid-cols-1 gap-2">
                                    {['What are the security requirements?', 'Summarize this project', 'What are the main goals?'].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setMessage(q)}
                                            className="text-[11px] text-left p-2 rounded-lg border border-gray-200 bg-white hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            "{q}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {history.map((msg, i) => (
                            <div key={i} className={`flex group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`relative p-3 rounded-2xl text-[13px] shadow-sm ${msg.role === 'user'
                                        ? 'bg-[var(--color-primary)] text-white rounded-tr-none'
                                        : msg.isError
                                            ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                                            : 'bg-white text-gray-800 border border-[var(--color-border)] rounded-tl-none'
                                        }`}>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>

                                        {/* Actions */}
                                        <div className={`mt-2 flex items-center gap-2 border-t pt-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'border-white/20 justify-end' : 'border-gray-100 justify-start'
                                            }`}>
                                            <button
                                                onClick={() => handleCopy(msg.content, i)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/5 transition-colors text-[11px] font-semibold ${msg.role === 'user' ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                                title="Copy"
                                            >
                                                {copiedId === i ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                <span>{copiedId === i ? 'Copied' : 'Copy'}</span>
                                            </button>
                                            {msg.role === 'assistant' && !msg.isError && (
                                                <button
                                                    onClick={() => handleSaveToNoteQuickly(msg.content)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-black/5 transition-colors text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                                                    title="Add to Notes"
                                                >
                                                    <FilePlus size={14} />
                                                    <span>Add to Note</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 items-center text-gray-400 text-xs italic ml-9">
                                    <Loader2 size={12} className="animate-spin" />
                                    Assistant is typing...
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-2 rounded-lg bg-red-50 text-[11px] text-red-600 border border-red-100 flex items-center gap-2">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 border-t border-[var(--color-border)] bg-white">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 focus-within:bg-white transition-all border border-transparent focus-within:border-[var(--color-primary)]/30">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your question..."
                                className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || loading}
                                className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-50 disabled:bg-gray-400 hover:scale-105 active:scale-95 transition-all"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 mt-2">Powered by AI Study Project Intelligence</p>
                    </form>
                </>
            )}
        </div>
    );
};

export default ProjectChat;
