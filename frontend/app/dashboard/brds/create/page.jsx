"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import {
    Plus, Sparkles, Search, FileText, ChevronDown, Check, X,
    ChevronRight, Layout, ShieldCheck, Clock, BookOpen, AlertCircle,
    ArrowLeft, Zap, Info, ListChecks, Target
} from 'lucide-react';

export default function CreateBRDPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    // State
    const [loading, setLoading] = useState(false);
    const [userStories, setUserStories] = useState([]);
    const [aiStories, setAiStories] = useState([]);
    const [customTemplates, setCustomTemplates] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [genLog, setGenLog] = useState('');

    const [generateForm, setGenerateForm] = useState({
        selectedStories: [],
        title: '',
        template: 'full',
        tone: 'professional',
        description: '',
        useAiStories: false,
    });

    const [storySearch, setStorySearch] = useState('');
    const [storyPage, setStoryPage] = useState(1);
    const [storyPageSize, setStoryPageSize] = useState(12);

    const logs = [
        'Synthesizing Entity Nodes...',
        'Aligning Architectural Logic...',
        'Calibrating Communication Tone...',
        'Structuring Document Schema...',
        'Injecting Strategic Objectives...',
        'Finalizing Intelligence Output...'
    ];

    // Lifecycle
    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        let interval;
        if (generating) {
            let i = 0;
            setGenLog(logs[0]);
            interval = setInterval(() => {
                i = (i + 1) % logs.length;
                setGenLog(logs[i]);
            }, 1800);
        }
        return () => clearInterval(interval);
    }, [generating]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [uRes, aRes, tRes] = await Promise.all([
                api.get('/user-stories'),
                api.get('/ai/stories/all'),
                api.get('/templates?category=brd')
            ]);
            setUserStories(Array.isArray(uRes.data) ? uRes.data : uRes.data.stories || []);
            setAiStories(Array.isArray(aRes.data) ? aRes.data : aRes.data.stories || []);
            setCustomTemplates(Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []));
        } catch (err) {
            console.error("Failed to load drafting data", err);
        } finally {
            setLoading(false);
        }
    };

    // Logic
    const storiesSource = useMemo(() => (generateForm.useAiStories ? aiStories : userStories), [generateForm.useAiStories, aiStories, userStories]);

    const filteredStories = useMemo(() => {
        const term = storySearch.trim().toLowerCase();
        if (!term) return storiesSource;
        return storiesSource.filter(s => (s.title || '').toLowerCase().includes(term) || (s.description || '').toLowerCase().includes(term));
    }, [storiesSource, storySearch]);

    const totalStoryPages = Math.max(1, Math.ceil(filteredStories.length / storyPageSize));
    const paginatedStories = useMemo(() => {
        const start = (storyPage - 1) * storyPageSize;
        return filteredStories.slice(start, start + storyPageSize);
    }, [filteredStories, storyPage, storyPageSize]);

    useEffect(() => { setStoryPage(1); }, [storySearch, generateForm.useAiStories]);

    const toggleStorySelection = (storyId) => {
        const idStr = String(storyId);
        setGenerateForm(prev => ({
            ...prev,
            selectedStories: prev.selectedStories.map(String).includes(idStr)
                ? prev.selectedStories.filter(id => String(id) !== idStr)
                : [...prev.selectedStories, idStr]
        }));
    };

    const selectAllVisibleStories = () => {
        const visibleIds = filteredStories.map(s => String(s.id));
        setGenerateForm(prev => {
            const alreadySelected = prev.selectedStories.map(String);
            const allSelectedItems = Array.from(new Set([...alreadySelected, ...visibleIds]));
            return { ...prev, selectedStories: allSelectedItems };
        });
    };

    const clearSelectedStories = () => {
        setGenerateForm(prev => ({ ...prev, selectedStories: [] }));
    };

    const readyForStep = (step) => {
        if (step === 0) return generateForm.title.length > 2;
        if (step === 1) return generateForm.selectedStories.length > 0;
        return true;
    };

    const handleGenerateBRD = async () => {
        try {
            setGenerating(true);
            const payload = {
                story_ids: generateForm.selectedStories,
                title: generateForm.title,
                template: generateForm.template,
                tone: generateForm.tone,
                target_audience: generateForm.description
            };
            await api.post('/brd/generate', payload);
            router.push('/dashboard/brds?success=true');
        } catch (err) {
            console.error("Generation failed", err);
            alert("Intelligence synthesis failed. Please check network protocols.");
        } finally {
            setGenerating(false);
        }
    };

    const steps = [
        { key: 'identity', label: 'Identity & Protocol' },
        { key: 'stories', label: 'Requirement Entities' },
        { key: 'preview', label: 'Blueprint Preview' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-sm">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header title="Create BRD" />

                <main className="flex-1 overflow-hidden flex flex-col relative">

                    {/* Top Wizard Navigation */}
                    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shrink-0">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-all font-medium text-xs group">
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
                            </button>

                            {/* Progress Stepper */}
                            <div className="flex items-center gap-0 max-w-sm w-full">
                                {steps.map((step, idx) => (
                                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                                        <div className="flex items-center justify-center relative">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${idx === currentStep ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : idx < currentStep ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {idx < currentStep ? <Check size={12} strokeWidth={3} /> : idx + 1}
                                            </div>
                                            <span className={`absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold ${idx === currentStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className="flex-1 h-[1.5px] mx-1.5 bg-slate-200 relative overflow-hidden">
                                                <div
                                                    className="absolute inset-0 bg-indigo-600 transition-all duration-500"
                                                    style={{ width: idx < currentStep ? '100%' : '0%' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="w-20" />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                        <div className="max-w-3xl mx-auto h-full flex flex-col">

                            {/* STEP 1: IDENTITY */}
                            {currentStep === 0 && (
                                <div className="max-w-2xl mx-auto w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <header className="text-center space-y-0.5">
                                        <div className="inline-flex p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mb-0.5">
                                            <Layout size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">Project Details</h2>
                                        <p className="text-xs text-slate-500">Define the basic information for your BRD</p>
                                    </header>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-slate-600 ml-1">Project Title</label>
                                            <input
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                placeholder="e.g., Enterprise Payment Gateway"
                                                value={generateForm.title}
                                                onChange={(e) => setGenerateForm(p => ({ ...p, title: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-600 ml-1">Template</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                    value={generateForm.template}
                                                    onChange={(e) => setGenerateForm(p => ({ ...p, template: e.target.value }))}
                                                >
                                                    <option value="full">Professional (Full)</option>
                                                    <option value="compact">Compact (Lean)</option>
                                                    {Array.isArray(customTemplates) && customTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Tone</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                    value={generateForm.tone}
                                                    onChange={(e) => setGenerateForm(p => ({ ...p, tone: e.target.value }))}
                                                >
                                                    <option value="professional">Professional</option>
                                                    <option value="executive">Executive</option>
                                                    <option value="agile">Agile</option>
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5 pt-1">
                                            <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Description (Optional)</label>
                                            <textarea
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-none"
                                                placeholder="Briefly describe the project objectives..."
                                                value={generateForm.description}
                                                onChange={(e) => setGenerateForm(p => ({ ...p, description: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: REQUIREMENT ENTITIES */}
                            {currentStep === 1 && (
                                <div className="flex flex-col h-full animate-in fade-in duration-300">
                                    <header className="mb-3 flex items-end justify-between">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-bold text-slate-900">Select Stories</h2>
                                                <div className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[11px] font-semibold shadow-sm">
                                                    {generateForm.selectedStories.length}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500">Choose user stories to include in your BRD</p>
                                        </div>

                                        <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
                                            {[
                                                { label: 'AI Stories', val: true, icon: Sparkles },
                                                { label: 'Manual', val: false, icon: FileText }
                                            ].map(tab => (
                                                <button
                                                    key={tab.label}
                                                    onClick={() => setGenerateForm(p => ({ ...p, useAiStories: tab.val }))}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${generateForm.useAiStories === tab.val ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <tab.icon size={13} />
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </header>

                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1 relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-all" size={16} />
                                            <input
                                                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
                                                placeholder="Search stories..."
                                                value={storySearch}
                                                onChange={(e) => setStorySearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={selectAllVisibleStories} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm">Select All</button>
                                            <button onClick={clearSelectedStories} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-all shadow-sm">Clear</button>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pb-4">
                                        {paginatedStories.length === 0 ? (
                                            <div className="col-span-full py-16 bg-white rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                    <ListChecks size={28} />
                                                </div>
                                                <p className="text-slate-400 font-medium text-xs">No stories found</p>
                                            </div>
                                        ) : (
                                            paginatedStories.map(story => {
                                                const active = generateForm.selectedStories.map(String).includes(String(story.id));
                                                return (
                                                    <div
                                                        key={story.id}
                                                        onClick={() => toggleStorySelection(story.id)}
                                                        className={`p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center mb-2 transition-all ${active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                            {active ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-xs font-semibold mb-0.5 line-clamp-2 ${active ? 'text-white' : 'text-slate-900'}`}>{story.title}</h4>
                                                            <p className={`text-[11px] font-medium line-clamp-2 leading-relaxed ${active ? 'text-indigo-100' : 'text-slate-500'}`}>{story.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    <div className="pb-4 flex items-center justify-center gap-2.5">
                                        <button disabled={storyPage === 1} onClick={() => setStoryPage(p => p - 1)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 transition-all shadow-sm"><ArrowLeft size={16} /></button>
                                        <span className="text-xs font-semibold text-slate-700">{storyPage} / {totalStoryPages}</span>
                                        <button disabled={storyPage === totalStoryPages} onClick={() => setStoryPage(p => p + 1)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={16} /></button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: BLUEPRINT PREVIEW */}
                            {currentStep === 2 && (
                                <div className="flex flex-col h-full animate-in fade-in duration-300">
                                    <header className="mb-3">
                                        <h2 className="text-xl font-bold text-slate-900 mb-0.5">Preview</h2>
                                        <p className="text-xs text-slate-500">Review your BRD configuration before generating</p>
                                    </header>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1">

                                        {/* Sidebar: Summary */}
                                        <div className="lg:col-span-1 space-y-3">
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md w-fit border border-emerald-100">
                                                    <ShieldCheck size={12} />
                                                    <span className="text-[11px] font-semibold">Ready</span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-medium text-slate-500 mb-0.5">Project Title</span>
                                                        <span className="text-sm font-bold text-slate-900 leading-tight">{generateForm.title}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-medium text-slate-500 mb-0.5">Template</span>
                                                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                            {generateForm.template === 'full' ? 'Professional (Full)' : 'Compact (Lean)'}
                                                            <Zap size={11} className="text-amber-500" />
                                                        </span>
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-medium text-slate-500 mb-0.5">Stories</span>
                                                            <span className="text-lg font-bold text-indigo-600">{generateForm.selectedStories.length}</span>
                                                        </div>
                                                        <div className="flex -space-x-1.5">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                                                    <FileText size={10} className="text-slate-400" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {generateForm.description && (
                                                <div className="bg-indigo-600 p-4 rounded-xl text-white space-y-2 shadow-lg shadow-indigo-200">
                                                    <h4 className="flex items-center gap-1.5 text-[11px] font-semibold"><Info size={11} /> Description</h4>
                                                    <p className="text-[11px] font-medium leading-relaxed opacity-95">
                                                        "{generateForm.description}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Main Content: Document Structure */}
                                        <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-[11px] font-semibold text-slate-600">Document Sections</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[11px] font-medium text-slate-600">Ready</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                                                {[
                                                    { id: '01', title: 'Executive Summary', type: 'Overview' },
                                                    { id: '02', title: 'Business Process', type: 'Process' },
                                                    { id: '03', title: 'Functional Requirements', type: 'Requirements' },
                                                    { id: '04', title: 'User Experience', type: 'UX' },
                                                    { id: '05', title: 'Data & Security', type: 'Security' },
                                                    { id: '06', title: 'Stakeholder Matrix', type: 'Governance' },
                                                    { id: '07', title: 'Timeline & Delivery', type: 'Planning' },
                                                ].map(item => (
                                                    <div key={item.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all cursor-default">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">{item.id}</span>
                                                            <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                                                        </div>
                                                        <div className="px-2.5 py-0.5 bg-slate-50 text-[11px] font-medium text-slate-500 rounded-md border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">{item.type}</div>
                                                    </div>
                                                ))}
                                                <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center italic text-slate-400 text-xs font-medium">
                                                    + Additional sections based on template
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Persistent Action Bar */}
                    <div className="bg-white border-t border-slate-200 px-4 py-3 shrink-0 relative overflow-hidden">

                        {/* Background Loading Progress Line */}
                        {generating && (
                            <div className="absolute top-0 left-0 h-0.5 w-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-indigo-600 animate-loading-bar shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                            </div>
                        )}

                        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">

                            <div className="flex items-center gap-2.5">
                                {generating ? (
                                    <div className="flex items-center gap-2.5 animate-in fade-in">
                                        <div className="relative">
                                            <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={9} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-indigo-600 leading-none mb-0.5">Generating...</span>
                                            <span className="text-xs font-medium text-slate-600">{genLog}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[11px] font-medium text-slate-500">Ready</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5">
                                {!generating && (
                                    <>
                                        <button
                                            onClick={() => { if (currentStep > 0) setCurrentStep(s => s - 1); else router.back(); }}
                                            className="px-5 py-2 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition-all"
                                        >
                                            {currentStep === 0 ? 'Cancel' : 'Back'}
                                        </button>
                                        <button
                                            onClick={() => { if (currentStep === steps.length - 1) handleGenerateBRD(); else setCurrentStep(s => s + 1); }}
                                            disabled={!readyForStep(currentStep)}
                                            className="min-w-[120px] px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 group"
                                        >
                                            <span>{currentStep === steps.length - 1 ? 'Generate BRD' : 'Continue'}</span>
                                            {currentStep < steps.length - 1 && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </main>
            </div>

            <style jsx global>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
