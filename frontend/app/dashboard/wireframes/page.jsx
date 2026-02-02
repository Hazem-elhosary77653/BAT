'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, X, Download, Link as LinkIcon, Sparkles, Settings, Square, Circle, Type, Minus, Eye } from 'lucide-react';
import api from '@/lib/api';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';

const WireframesPage = () => {
  const [wireframes, setWireframes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWireframe, setSelectedWireframe] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stories, setStories] = useState([]);
  const [brds, setBrds] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [selectedBrdId, setSelectedBrdId] = useState('');
  const [loadingSources, setLoadingSources] = useState(false);
  const [selectedTool, setSelectedTool] = useState('rect'); // select, rect, circle, line, text
  const canvasRef = useRef(null);
  const [canvasElements, setCanvasElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [activeElementId, setActiveElementId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewWireframe, setPreviewWireframe] = useState(null);
  const previewCanvasRef = useRef(null);

  const { toast, success: showSuccess, error: showError, close: closeToast } = useToast();

  // Fetch wireframes
  const fetchWireframes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/wireframes');
      if (response.data.success) {
        setWireframes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wireframes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWireframes();
  }, [fetchWireframes]);

  useEffect(() => {
    const loadSources = async () => {
      if (!showGenerator) return;
      try {
        setLoadingSources(true);
        const [storiesRes, brdsRes] = await Promise.all([
          api.get('/user-stories'),
          api.get('/brd')
        ]);
        setStories(Array.isArray(storiesRes.data) ? storiesRes.data : (storiesRes.data?.stories || storiesRes.data?.data || []));
        setBrds(brdsRes.data?.data || brdsRes.data || []);
      } catch (err) {
        console.error('Failed to load stories/BRDs for wireframe generation:', err);
      } finally {
        setLoadingSources(false);
      }
    };

    loadSources();
  }, [showGenerator]);

  // Generate wireframe from prompt
  const handleGenerateWireframe = async () => {
    if (!generatorPrompt.trim()) {
      showError('Please enter a description');
      return;
    }

    try {
      setIsGenerating(true);
      const selectedStory = stories.find((s) => String(s.id) === String(selectedStoryId));
      const selectedBrd = brds.find((b) => String(b.id) === String(selectedBrdId));

      let finalPrompt = generatorPrompt.trim();
      if (selectedStory) {
        const criteria = Array.isArray(selectedStory.acceptance_criteria)
          ? selectedStory.acceptance_criteria.join('\n')
          : (selectedStory.acceptance_criteria || '');
        finalPrompt += `\n\nUser Story:\nTitle: ${selectedStory.title || ''}\nDescription: ${selectedStory.description || ''}\nAcceptance Criteria:\n${criteria}`;
      }
      if (selectedBrd) {
        const brdContent = selectedBrd.content || selectedBrd.summary || selectedBrd.description || '';
        finalPrompt += `\n\nBRD:\nTitle: ${selectedBrd.title || ''}\nContent:\n${brdContent}`;
      }

      const response = await api.post('/wireframes/generate', {
        prompt: finalPrompt,
        brd_id: selectedBrdId || undefined,
        story_id: selectedStoryId || undefined,
        complexity: 'standard'
      });

      if (response.data.success) {
        const wireframeData = response.data.data;
        
        // Convert AI layout to canvas elements
        const canvasWidth = 1000;
        const canvasHeight = 600;
        const elements = [];
        
        if (wireframeData.layout && wireframeData.layout.sections) {
          wireframeData.layout.sections.forEach((section, sectionIdx) => {
            const pos = section.position;
            const sectionX = (parseFloat(pos.left) / 100) * canvasWidth;
            const sectionY = (parseFloat(pos.top) / 100) * canvasHeight;
            const sectionW = (parseFloat(pos.width) / 100) * canvasWidth;
            const sectionH = (parseFloat(pos.height) / 100) * canvasHeight;
            
            // Draw section background as rectangle
            elements.push({
              id: Date.now() + sectionIdx,
              type: 'rect',
              kind: 'section',
              x: sectionX,
              y: sectionY,
              width: sectionW,
              height: sectionH,
              color: section.backgroundColor || '#f3f4f6',
              label: section.name
            });
            
            // Draw section elements
            if (section.elements && section.elements.length > 0) {
              section.elements.forEach((el, elIdx) => {
                const elPos = el.position;
                const elX = sectionX + (parseFloat(elPos.left) / 100) * sectionW;
                const elY = sectionY + (parseFloat(elPos.top) / 100) * sectionH;
                const elW = (parseFloat(elPos.width) / 100) * sectionW;
                const elH = (parseFloat(elPos.height) / 100) * sectionH;
                
                if (el.type === 'button') {
                  elements.push({
                    id: Date.now() + sectionIdx * 100 + elIdx,
                    type: 'rect',
                    kind: 'button',
                    x: elX,
                    y: elY,
                    width: elW,
                    height: elH,
                    color: wireframeData.color_scheme?.primary || '#4A90E2'
                  });
                  elements.push({
                    id: Date.now() + sectionIdx * 100 + elIdx + 50,
                    type: 'text',
                    kind: 'text',
                    x: elX + 5,
                    y: elY + elH / 2,
                    width: elW,
                    height: elH,
                    text: el.label,
                    color: '#ffffff'
                  });
                } else if (el.type === 'text') {
                  elements.push({
                    id: Date.now() + sectionIdx * 100 + elIdx,
                    type: 'text',
                    kind: 'text',
                    x: elX,
                    y: elY + 15,
                    width: elW,
                    height: elH,
                    text: el.label,
                    color: wireframeData.color_scheme?.text || '#333333'
                  });
                }
              });
            }
          });
        }
        
        // Create wireframe with converted elements
        const createResponse = await api.post('/wireframes', {
          title: wireframeData.title || 'Generated Wireframe',
          description: wireframeData.description,
          canvas_json: JSON.stringify({ elements, original: wireframeData }),
          wireframe_type: 'ui_mockup'
        });

        if (createResponse.data.success) {
          showSuccess('Wireframe generated successfully!');
          setGeneratorPrompt('');
          setSelectedStoryId('');
          setSelectedBrdId('');
          setShowGenerator(false);
          fetchWireframes();
        }
      }
    } catch (error) {
      console.error('Error generating wireframe:', error);
      showError('Failed to generate wireframe');
    } finally {
      setIsGenerating(false);
    }
  };

  // Create new wireframe (blank canvas)
  const handleCreateBlank = () => {
    setSelectedWireframe({ title: '', description: '', wireframe_type: 'ui_mockup' });
    setCanvasElements([]);
    setSelectedElementId(null);
    setIsCreating(true);
  };

  // Save wireframe
  const handleSaveWireframe = async () => {
    if (!selectedWireframe || !selectedWireframe.title?.trim()) {
      showError('Please enter a wireframe title');
      return;
    }

    try {
      const wireframeData = {
        title: selectedWireframe.title,
        description: selectedWireframe.description || '',
        canvas_json: JSON.stringify({ elements: canvasElements }),
        wireframe_type: selectedWireframe.wireframe_type || 'ui_mockup',
        status: 'saved'
      };

      if (isCreating) {
        // Create new
        const response = await api.post('/wireframes', wireframeData);
        if (response.data.success) {
          showSuccess('Wireframe created successfully!');
          setIsCreating(false);
          setSelectedWireframe(null);
          setCanvasElements([]);
          fetchWireframes();
        }
      } else {
        // Update existing
        const response = await api.put(`/wireframes/${selectedWireframe.id}`, wireframeData);
        if (response.data.success) {
          showSuccess('Wireframe saved successfully!');
          setIsEditing(false);
          setSelectedWireframe(null);
          setCanvasElements([]);
          fetchWireframes();
        }
      }
    } catch (error) {
      console.error('Error saving wireframe:', error);
      showError('Failed to save wireframe');
    }
  };

  // Delete wireframe
  const handleDeleteWireframe = async (id) => {
    if (!confirm('Are you sure you want to delete this wireframe?')) return;

    try {
      const response = await api.delete(`/wireframes/${id}`);
      if (response.data.success) {
        showSuccess('Wireframe deleted');
        fetchWireframes();
      }
    } catch (error) {
      console.error('Error deleting wireframe:', error);
      showError('Failed to delete wireframe');
    }
  };

  // Edit wireframe
  const handleEditWireframe = async (wireframe) => {
    try {
      const response = await api.get(`/wireframes/${wireframe.id}`);
      if (response.data.success) {
        setSelectedWireframe(response.data.data);
        const parsed = JSON.parse(response.data.data.canvas_json || '{}');
        setCanvasElements(parsed.elements || []);
        setSelectedElementId(null);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading wireframe:', error);
      showError('Failed to load wireframe');
    }
  };

  // View wireframe
  const handleViewWireframe = async (wireframe) => {
    try {
      const response = await api.get(`/wireframes/${wireframe.id}`);
      if (response.data.success) {
        setSelectedWireframe(response.data.data);
        const parsed = JSON.parse(response.data.data.canvas_json || '{}');
        setCanvasElements(parsed.elements || []);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error loading wireframe:', error);
      showError('Failed to load wireframe');
    }
  };

  // Preview wireframe
  const handlePreviewWireframe = async (wireframe) => {
    try {
      const response = await api.get(`/wireframes/${wireframe.id}`);
      if (response.data.success) {
        setPreviewWireframe(response.data.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading wireframe:', error);
      showError('Failed to load wireframe');
    }
  };

  // Render preview canvas
  const renderPreviewCanvas = () => {
    if (!previewCanvasRef.current || !previewWireframe) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Helpers
    const roundRect = (x, y, w, h, r = 6) => {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw outer border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Parse and draw elements
    try {
      const parsed = JSON.parse(previewWireframe.canvas_json || '{}');
      const elements = parsed.elements || [];

      if (elements.length === 0) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('No shapes drawn yet', canvas.width / 2, canvas.height / 2);
        return;
      }

      elements.forEach((element) => {
        const isSection = element.kind === 'section';
        const isButton = element.kind === 'button';
        const isText = element.type === 'text';

        if (element.type === 'rect') {
          if (isSection) {
            // Section container: light fill + dashed border + label
            ctx.save();
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5f5';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 4]);
            ctx.fillRect(element.x, element.y, element.width, element.height);
            ctx.strokeRect(element.x, element.y, element.width, element.height);
            ctx.restore();

            if (element.label) {
              ctx.font = '11px sans-serif';
              ctx.fillStyle = '#64748b';
              ctx.textAlign = 'left';
              ctx.fillText(String(element.label), element.x + 6, element.y + 14);
            }
            return;
          }

          if (isButton) {
            ctx.save();
            ctx.fillStyle = '#e2e8f0';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            roundRect(element.x, element.y, element.width, element.height, 6);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            return;
          }

          // Default rectangle
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(element.x, element.y, element.width, element.height);
          return;
        }

        if (isText) {
          ctx.font = '12px sans-serif';
          ctx.fillStyle = element.color || '#334155';
          ctx.textAlign = 'left';
          ctx.fillText(element.text || 'Text', element.x, element.y + 4);
          return;
        }

        if (element.type === 'circle') {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(element.x + element.width / 2, element.y + element.height / 2, element.width / 2, 0, 2 * Math.PI);
          ctx.stroke();
          return;
        }

        if (element.type === 'line') {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(element.x, element.y);
          ctx.lineTo(element.x + element.width, element.y + element.height);
          ctx.stroke();
        }
      });
    } catch (e) {
      console.error('[Preview] Error rendering:', e);
    }
  };

  // Redraw preview canvas when opened
  useEffect(() => {
    if (showPreview && previewWireframe && previewCanvasRef.current) {
      // Multiple attempts to ensure canvas is ready
      const timeouts = [50, 150, 300];
      timeouts.forEach(delay => {
        setTimeout(() => renderPreviewCanvas(), delay);
      });
    }
  }, [showPreview, previewWireframe]);

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const hitTest = (element, x, y) => {
    if (element.type === 'rect' || element.type === 'text') {
      return x >= element.x && x <= element.x + element.width && y >= element.y && y <= element.y + element.height;
    }
    if (element.type === 'circle') {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      const r = element.width / 2;
      return Math.hypot(x - cx, y - cy) <= r;
    }
    if (element.type === 'line') {
      const x1 = element.x;
      const y1 = element.y;
      const x2 = element.x + element.width;
      const y2 = element.y + element.height;
      const dist = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.hypot(y2 - y1, x2 - x1);
      const withinBounds = x >= Math.min(x1, x2) - 5 && x <= Math.max(x1, x2) + 5 && y >= Math.min(y1, y2) - 5 && y <= Math.max(y1, y2) + 5;
      return dist <= 6 && withinBounds;
    }
    return false;
  };

  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    setCanvasElements((prev) => prev.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
  };

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e) => {
    if (!canvasRef.current || !isEditing) return;
    const { x, y } = getMousePos(e);

    if (selectedTool === 'select') {
      const hit = [...canvasElements].reverse().find((el) => hitTest(el, x, y));
      if (hit) {
        setSelectedElementId(hit.id);
        setIsDragging(true);
        setDragOffset({ x: x - hit.x, y: y - hit.y });
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    if (selectedTool === 'text') {
      const text = prompt('Text:', 'Text') || 'Text';
      const newElement = {
        id: Date.now(),
        type: 'text',
        x,
        y,
        width: Math.max(60, text.length * 7),
        height: 20,
        text,
        color: '#334155'
      };
      setCanvasElements((prev) => [...prev, newElement]);
      return;
    }

    const newElement = {
      id: Date.now(),
      type: selectedTool,
      x,
      y,
      width: 0,
      height: 0,
      text: '',
      color: '#94a3b8'
    };

    setDrawStart({ x, y });
    setIsDrawing(true);
    setActiveElementId(newElement.id);
    setCanvasElements((prev) => [...prev, newElement]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current || !isEditing) return;
    const { x, y } = getMousePos(e);

    if (isDragging && selectedElementId) {
      setCanvasElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          return { ...el, x: x - dragOffset.x, y: y - dragOffset.y };
        })
      );
      return;
    }

    if (!isDrawing || !drawStart || !activeElementId) return;
    const dx = x - drawStart.x;
    const dy = y - drawStart.y;

    setCanvasElements((prev) =>
      prev.map((el) => {
        if (el.id !== activeElementId) return el;

        if (el.type === 'line') {
          return { ...el, width: dx, height: dy };
        }

        const newX = dx < 0 ? x : drawStart.x;
        const newY = dy < 0 ? y : drawStart.y;
        const newW = Math.abs(dx);
        const newH = Math.abs(dy);
        return { ...el, x: newX, y: newY, width: newW, height: newH };
      })
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
    setDrawStart(null);
    setActiveElementId(null);
  };

  // Render canvas
  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    canvasElements.forEach(element => {
      ctx.strokeStyle = element.color || '#94a3b8';
      ctx.fillStyle = 'rgba(148,163,184,0.08)';
      ctx.lineWidth = 1.5;

      switch (element.type) {
        case 'rect':
          ctx.strokeRect(element.x, element.y, element.width, element.height);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(element.x + element.width / 2, element.y + element.height / 2, element.width / 2, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(element.x, element.y);
          ctx.lineTo(element.x + element.width, element.y + element.height);
          ctx.stroke();
          break;
        case 'text':
          ctx.font = '14px sans-serif';
          ctx.fillStyle = element.color || '#334155';
          ctx.fillText(element.text || 'Text', element.x, element.y + 14);
          break;
      }

      if (element.id === selectedElementId) {
        ctx.save();
        ctx.strokeStyle = '#0b2b4c';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        if (element.type === 'circle') {
          ctx.beginPath();
          ctx.arc(element.x + element.width / 2, element.y + element.height / 2, element.width / 2 + 4, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (element.type === 'line') {
          ctx.strokeRect(
            Math.min(element.x, element.x + element.width) - 4,
            Math.min(element.y, element.y + element.height) - 4,
            Math.abs(element.width) + 8,
            Math.abs(element.height) + 8
          );
        } else {
          ctx.strokeRect(element.x - 4, element.y - 4, element.width + 8, element.height + 8);
        }
        ctx.restore();
      }
    });
  };

  // Redraw canvas when elements change
  useEffect(() => {
    if (isEditing || isCreating) {
      renderCanvas();
    }
  }, [canvasElements, isEditing, isCreating]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type}
                  duration={toast.duration}
                  onClose={closeToast}
                />
              )}

              <PageHeader
                title="Wireframes"
                description="Design UI mockups and wireframes with AI assistance."
              />

              {/* Action Buttons */}
              {!isCreating && !isEditing && (
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateBlank}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold hover:bg-[#0b2b4c]/90 transition-all"
                  >
                    <Plus size={18} />
                    Create Blank
                  </button>
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-semibold hover:bg-amber-100 transition-all"
                  >
                    <Sparkles size={18} />
                    Generate from Description
                  </button>
                </div>
              )}

              {/* Wireframe List */}
              {!isCreating && !isEditing && (
                <>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm"></div>
                      ))}
                    </div>
                  ) : wireframes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wireframes.map((wireframe) => (
                        <div
                          key={wireframe.id}
                          className="group relative p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                        >
                          <h3 className="text-lg font-bold text-gray-900 truncate">{wireframe.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{wireframe.description}</p>
                          
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              {wireframe.wireframe_type}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              wireframe.status === 'draft' 
                                ? 'bg-yellow-50 text-yellow-700' 
                                : 'bg-green-50 text-green-700'
                            }`}>
                              {wireframe.status}
                            </span>
                          </div>

                          <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handlePreviewWireframe(wireframe)}
                              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-all"
                              title="Preview"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEditWireframe(wireframe)}
                              className="flex-1 px-3 py-2 bg-[#0b2b4c] text-white rounded-lg text-sm font-semibold hover:bg-[#0b2b4c]/90 transition-all"
                            >
                              <Edit2 size={14} className="inline mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteWireframe(wireframe.id)}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                            {new Date(wireframe.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings size={28} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">No wireframes yet</h3>
                      <p className="text-gray-500 mt-1 max-w-xs mx-auto text-sm">
                        Create your first wireframe or generate one from a description.
                      </p>
                      <button
                        onClick={handleCreateBlank}
                        className="mt-6 px-6 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold text-sm hover:bg-[#0b2b4c]/90 transition-all"
                      >
                        Create Wireframe
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Excalidraw Canvas */}
              {(isCreating || isEditing) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {isCreating ? 'Create Wireframe' : 'Edit Wireframe'}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setIsEditing(false);
                          setSelectedWireframe(null);
                          setCanvasElements([]);
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-100"
                      >
                        <X size={18} className="inline mr-1" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveWireframe}
                        className="px-4 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold text-sm hover:bg-[#0b2b4c]/90 flex items-center gap-2"
                      >
                        <Save size={18} />
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Wireframe Info */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      placeholder="Wireframe Title"
                      value={selectedWireframe?.title || ''}
                      onChange={(e) =>
                        setSelectedWireframe({
                          ...selectedWireframe,
                          title: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10"
                    />
                    <textarea
                      placeholder="Description"
                      value={selectedWireframe?.description || ''}
                      onChange={(e) =>
                        setSelectedWireframe({
                          ...selectedWireframe,
                          description: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 min-h-[80px]"
                    />
                  </div>

                  {/* Drawing Tools */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTool('select')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedTool === 'select'
                          ? 'border-[#0b2b4c] bg-[#0b2b4c]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="Select / Move"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => setSelectedTool('rect')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedTool === 'rect'
                          ? 'border-[#0b2b4c] bg-[#0b2b4c]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="Rectangle"
                    >
                      <Square size={20} />
                    </button>
                    <button
                      onClick={() => setSelectedTool('circle')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedTool === 'circle'
                          ? 'border-[#0b2b4c] bg-[#0b2b4c]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="Circle"
                    >
                      <Circle size={20} />
                    </button>
                    <button
                      onClick={() => setSelectedTool('line')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedTool === 'line'
                          ? 'border-[#0b2b4c] bg-[#0b2b4c]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="Line"
                    >
                      <Minus size={20} />
                    </button>
                    <button
                      onClick={() => setSelectedTool('text')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedTool === 'text'
                          ? 'border-[#0b2b4c] bg-[#0b2b4c]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title="Text"
                    >
                      <Type size={20} />
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={!selectedElementId}
                      className="ml-auto px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={() => {
                        setCanvasElements([]);
                        setSelectedElementId(null);
                      }}
                      className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-100"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Canvas */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={1000}
                      height={600}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      className={`w-full border-b border-gray-100 ${
                        selectedTool === 'select' ? 'cursor-move' : 'cursor-crosshair'
                      }`}
                      style={{ maxHeight: '600px' }}
                    />
                    <div className="text-xs text-gray-400 p-3 bg-gray-50">
                      Drag to draw shapes • Select tool to move • Total elements: {canvasElements.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Generator Modal */}
      <Modal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        title="Generate Wireframe"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Based on User Story (optional)</label>
              <select
                value={selectedStoryId}
                onChange={(e) => setSelectedStoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10"
              >
                <option value="">Select a story</option>
                {stories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {story.title || `Story #${story.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Based on BRD (optional)</label>
              <select
                value={selectedBrdId}
                onChange={(e) => setSelectedBrdId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10"
              >
                <option value="">Select a BRD</option>
                {brds.map((brd) => (
                  <option key={brd.id} value={brd.id}>
                    {brd.title || `BRD #${brd.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loadingSources && (
            <div className="text-xs text-gray-400">Loading stories and BRDs...</div>
          )}
          <textarea
            placeholder="Describe the UI you want. E.g., 'A mobile app dashboard with user profile, stats cards, and activity feed'"
            value={generatorPrompt}
            onChange={(e) => setGeneratorPrompt(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b2b4c]/10 min-h-[150px]"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowGenerator(false)}
              className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateWireframe}
              disabled={isGenerating || !generatorPrompt.trim()}
              className="flex-1 px-4 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold hover:bg-[#0b2b4c]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewWireframe(null);
        }}
        title={previewWireframe?.title || 'Wireframe Preview'}
        size="xl"
      >
        <div className="space-y-4">
          {previewWireframe?.description && (
            <p className="text-sm text-gray-600">{previewWireframe.description}</p>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
              {previewWireframe?.wireframe_type}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              previewWireframe?.status === 'draft' 
                ? 'bg-yellow-50 text-yellow-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {previewWireframe?.status}
            </span>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <canvas
              ref={previewCanvasRef}
              width={1000}
              height={600}
              className="w-full"
              style={{ maxHeight: '600px' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPreview(false);
                setPreviewWireframe(null);
              }}
              className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-100"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                if (previewWireframe) {
                  handleEditWireframe(previewWireframe);
                }
              }}
              className="flex-1 px-4 py-2 bg-[#0b2b4c] text-white rounded-lg font-semibold hover:bg-[#0b2b4c]/90 flex items-center justify-center gap-2"
            >
              <Edit2 size={18} />
              Edit Wireframe
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WireframesPage;
