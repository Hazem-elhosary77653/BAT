'use client';
import PageHeader from '@/components/PageHeader';
import { Zap, Edit2, CheckCircle, XCircle } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

const defaultForm = {
  api_key: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 2000,
  language: 'en',
  detail_level: 'standard',
};

// Get maximum tokens for a specific model
function getMaxTokensForModel(model) {
  const maxTokens = {
    'gpt-4': 4096,
    'gpt-4-turbo': 4096,
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-16k': 16384,
  };
  return maxTokens[model] || 4096;
}

export default function AiConfigPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [apiKeyPreview, setApiKeyPreview] = useState(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);


  // تم حذف خاصية الكريدت بناءً على سياسة OpenAI الجديدة


  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadConfig();
    // لا داعي لجلب الكريدت بعد الآن
  }, [user, router]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai-config');
      const cfg = res.data?.data || {};
      setForm((prev) => ({
        ...prev,
        model: cfg.model || prev.model,
        temperature: cfg.temperature ?? prev.temperature,
        max_tokens: cfg.max_tokens || prev.max_tokens,
        language: cfg.language || prev.language,
        detail_level: cfg.detail_level || prev.detail_level,
        api_key: '',
      }));
      setApiConfigured(!!cfg.api_key_configured);
      setApiKeyPreview(cfg.api_key_preview || null);
      setIsEditingApiKey(false);
      setStatus(null);
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      
      // If model changed, ensure max_tokens doesn't exceed the new model's limit
      if (field === 'model') {
        const newMaxTokens = getMaxTokensForModel(value);
        if (updated.max_tokens > newMaxTokens) {
          updated.max_tokens = newMaxTokens;
        }
      }
      
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = { ...form };
      // Only include API key if user is editing it
      if (!isEditingApiKey || !payload.api_key) {
        delete payload.api_key; // keep existing if not provided
      }
      await api.put('/ai-config', payload);
      setStatus({ type: 'success', message: 'Configuration saved' });
      
      // Reload to get the masked key
      await loadConfig();
    } catch (err) {
      const errData = err.response?.data?.error;
      const msg = typeof errData === 'object' ? errData.message : (errData || err.message || 'Save failed');
      setStatus({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    // Allow testing if API key is configured or if user entered a new key
    if (!form.api_key && !apiConfigured) {
      setStatus({ type: 'error', message: 'Enter an API key or configure one first' });
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      // Send the API key only if user entered a new one
      const payload = form.api_key ? { api_key: form.api_key } : {};
      const res = await api.post('/ai-config/test', payload);
      if (res.data?.success) {
        setStatus({ type: 'success', message: 'Connection successful ✓' });
      } else {
        setStatus({ type: 'error', message: 'Connection failed' });
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      const msg = typeof errData === 'object' ? errData.message : (errData || err.message || 'Connection failed');
      setStatus({ type: 'error', message: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.post('/ai-config/reset');
      setForm(defaultForm);
      setApiConfigured(false);
      setApiKeyPreview(null);
      setIsEditingApiKey(false);
      setStatus({ type: 'success', message: 'Configuration reset to defaults' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Reset failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditApiKey = () => {
    setIsEditingApiKey(true);
    setForm((prev) => ({ ...prev, api_key: '' }));
  };

  const handleCancelEditApiKey = () => {
    setIsEditingApiKey(false);
    setForm((prev) => ({ ...prev, api_key: '' }));
  };

  return (
    <div className="flex h-screen bg-light">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <PageHeader
              title="AI Configuration"
              description="Manage your OpenAI settings, API keys, and test connectivity."
              icon={Zap}
              actions={
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${
                  apiConfigured 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {apiConfigured ? (
                    <CheckCircle size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span>
                    {apiConfigured ? 'Connected' : 'Not Configured'}
                  </span>
                </div>
              }
            />

            {status && (
              <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
                status.type === 'error' 
                  ? 'border-red-200 bg-red-50 text-red-700' 
                  : 'border-green-200 bg-green-50 text-green-700'
              }`}>
                {status.type === 'error' ? (
                  <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSave}>
                  {/* AI Model & API Key Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">AI Model Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.model}
                          onChange={(e) => handleChange('model', e.target.value)}
                          className="input w-full"
                        >
                          <option value="gpt-4">GPT-4 (Most Capable)</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo (Faster)</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cost-Effective)</option>
                          <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K (Extended Context)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the AI model for generation tasks</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OpenAI API Key <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          {apiConfigured && !isEditingApiKey ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={apiKeyPreview || ''}
                                disabled
                                className="input w-full bg-gray-50 cursor-not-allowed font-mono text-sm"
                              />
                              <button
                                type="button"
                                onClick={handleEditApiKey}
                                className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit API Key"
                              >
                                <Edit2 size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="password"
                                value={form.api_key}
                                onChange={(e) => handleChange('api_key', e.target.value)}
                                placeholder={apiConfigured ? 'Enter new API key to update' : 'sk-...'}
                                className="input w-full font-mono text-sm"
                              />
                              {isEditingApiKey && (
                                <button
                                  type="button"
                                  onClick={handleCancelEditApiKey}
                                  className="flex-shrink-0 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {apiConfigured ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              Your API key is securely stored and encrypted
                            </span>
                          ) : (
                            'Get your API key from OpenAI Platform'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Generation Parameters */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Generation Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                        <input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={form.temperature}
                          onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0)}
                          className="input w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {form.temperature <= 0.3 ? 'Precise & Focused' : 
                           form.temperature <= 0.7 ? 'Balanced' : 
                           'Creative & Diverse'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
                        <input
                          type="number"
                          min="100"
                          max={getMaxTokensForModel(form.model)}
                          step="100"
                          value={form.max_tokens}
                          onChange={(e) => handleChange('max_tokens', parseInt(e.target.value, 10) || 0)}
                          className="input w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Max: {getMaxTokensForModel(form.model).toLocaleString()} tokens for {form.model}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Detail Level</label>
                        <select
                          value={form.detail_level}
                          onChange={(e) => handleChange('detail_level', e.target.value)}
                          className="input w-full"
                        >
                          <option value="brief">Brief</option>
                          <option value="standard">Standard</option>
                          <option value="detailed">Detailed</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Content depth preference</p>
                      </div>
                    </div>
                  </div>

                  {/* Language & Actions */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Language & Testing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Output Language</label>
                        <select
                          value={form.language}
                          onChange={(e) => handleChange('language', e.target.value)}
                          className="input w-full"
                        >
                          <option value="en">English</option>
                          <option value="ar">العربية (Arabic)</option>
                          <option value="es">Español (Spanish)</option>
                          <option value="fr">Français (French)</option>
                          <option value="de">Deutsch (German)</option>
                          <option value="zh">中文 (Chinese)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">AI responses will be in this language</p>
                      </div>
                      
                      <div className="flex items-end gap-3">
                        <button
                          type="button"
                          onClick={handleTest}
                          className="btn btn-secondary flex-1"
                          disabled={testing || (!form.api_key && !apiConfigured)}
                        >
                          {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="btn btn-light"
                          disabled={saving}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <button
                      type="submit"
                      className="btn btn-primary px-6"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
