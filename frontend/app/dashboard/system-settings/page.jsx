'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import useToast from '@/hooks/useToast';
import {
  Settings, Globe, Mail, Shield, Database, Server, Activity, AlertCircle,
  CheckCircle, Save, RotateCcw, Lock, Key, Bell, Clock, FileText, Zap,
  HardDrive, Cloud, Package, Smartphone, Eye, EyeOff, MessageSquare, Hash, RefreshCw
} from 'lucide-react';
import * as azureApi from '@/lib/azure-api';

export default function SystemSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error: showError } = useToast();

  const [systemSettings, setSystemSettings] = useState({
    general: {
      site_name: 'Business Analyst Tool',
      site_description: 'Professional Business Analysis Platform',
      maintenance_mode: false,
      registration_enabled: true
    },
    security: {
      session_timeout: 30,
      max_login_attempts: 5,
      password_min_length: 8,
      require_2fa_for_admin: false,
      allow_password_reset: true
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_secure: true,
      smtp_user: '',
      from_email: 'noreply@businessanalyst.com',
      from_name: 'Business Analyst Tool'
    },
    storage: {
      max_file_size: 10,
      allowed_file_types: 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg',
      storage_path: '/uploads'
    },
    api: {
      rate_limit: 100,
      rate_limit_window: 15,
      api_enabled: true
    }
  });

  const [azureSettings, setAzureSettings] = useState({
    baseUrl: '',
    collection: '',
    project: '',
    patToken: '',
    showPatToken: false,
    testing: false,
    testResult: null,
    projects: [],
    selectedProject: '',
  });

  // Slack & Teams Integration Settings
  const [slackSettings, setSlackSettings] = useState({
    enabled: false,
    webhookUrl: '',
    botToken: '',
    channel: '',
    testing: false,
    testResult: null,
    showToken: false
  });

  const [teamsSettings, setTeamsSettings] = useState({
    enabled: false,
    webhookUrl: '',
    tenantId: '',
    testing: false,
    testResult: null
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchSystemSettings();
    // تحميل Azure Settings
    const config = azureApi.getAzureConfig();
    const pat = localStorage.getItem('azure_pat') || '';
    setAzureSettings(prev => ({
      ...prev,
      baseUrl: config.baseUrl,
      collection: config.collection,
      project: config.project,
      patToken: pat,
    }));
  }, [user, router]);

  const fetchSystemSettings = async () => {
    try {
      const response = await api.get('/system-settings').catch(() => null);
      if (response?.data?.data) {
        setSystemSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/system-settings', systemSettings);
      success('System settings saved successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all system settings to defaults?')) return;

    try {
      setSaving(true);
      await api.post('/system-settings/reset');
      fetchSystemSettings();
      success('System settings reset to defaults');
    } catch (err) {
      showError('Failed to reset system settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const loadAzureProjects = async () => {
    if (!azureSettings.baseUrl.trim() || !azureSettings.collection.trim() || !azureSettings.patToken.trim()) {
      showError('Please enter Base URL, Collection Name, and PAT Token');
      return;
    }

    try {
      setAzureSettings(prev => ({ ...prev, testing: true, testResult: null }));

      azureApi.setAzureConfig({
        baseUrl: azureSettings.baseUrl,
        collection: azureSettings.collection,
        project: 'temp',
      });
      azureApi.setAzurePAT(azureSettings.patToken);

      const testResult = await azureApi.testAzureConnection();

      if (!testResult.success) {
        setAzureSettings(prev => ({
          ...prev,
          testing: false,
          testResult: { success: false, message: testResult.error || 'Connection failed' }
        }));
        return;
      }

      const projectsData = await azureApi.getAzureProjects();

      if (projectsData && projectsData.length > 0) {
        setAzureSettings(prev => ({
          ...prev,
          projects: projectsData,
          testing: false,
          testResult: { success: true, message: `${projectsData.length} projects loaded successfully` }
        }));
        localStorage.setItem('azure_pat', azureSettings.patToken);
        success('Connected to Azure DevOps successfully!');
      } else {
        setAzureSettings(prev => ({
          ...prev,
          testing: false,
          testResult: { success: false, message: 'No projects found' }
        }));
      }
    } catch (err) {
      setAzureSettings(prev => ({
        ...prev,
        testing: false,
        testResult: { success: false, message: err.message || 'Failed to connect' }
      }));
    }
  };

  const saveAzureConfiguration = async () => {
    if (!azureSettings.project.trim()) {
      showError('Please select a project first');
      return;
    }

    azureApi.setAzureConfig({
      baseUrl: azureSettings.baseUrl,
      collection: azureSettings.collection,
      project: azureSettings.project,
    });

    success('Azure DevOps settings saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'api', label: 'API Integration', icon: Zap },
    { id: 'azure', label: 'Azure DevOps', icon: Cloud },
    { id: 'integrations', label: 'Slack & Teams', icon: MessageSquare }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Server className="text-orange-600" size={28} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-600">Manage global system configuration and preferences</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="text-orange-600" size={18} />
                  <p className="text-sm text-orange-800">
                    <strong>Admin Only:</strong> Changes here affect all users and system behavior
                  </p>
                </div>
              </div>

              {/* Settings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'text-orange-600 border-orange-600 bg-white'
                            : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                          <Icon size={18} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={systemSettings.general.site_name}
                          onChange={(e) => updateSetting('general', 'site_name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Description
                        </label>
                        <textarea
                          value={systemSettings.general.site_description}
                          onChange={(e) => updateSetting('general', 'site_description', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Maintenance Mode</p>
                          <p className="text-sm text-gray-600">Temporarily disable site access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.general.maintenance_mode}
                            onChange={(e) => updateSetting('general', 'maintenance_mode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">User Registration</p>
                          <p className="text-sm text-gray-600">Allow new users to register</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.general.registration_enabled}
                            onChange={(e) => updateSetting('general', 'registration_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="1440"
                          value={systemSettings.security.session_timeout}
                          onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">How long before users are automatically logged out</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="10"
                          value={systemSettings.security.max_login_attempts}
                          onChange={(e) => updateSetting('security', 'max_login_attempts', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">Failed login attempts before account lockout</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Password Length
                        </label>
                        <input
                          type="number"
                          min="6"
                          max="20"
                          value={systemSettings.security.password_min_length}
                          onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Require 2FA for Admins</p>
                          <p className="text-sm text-gray-600">Force two-factor authentication for admin accounts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.security.require_2fa_for_admin}
                            onChange={(e) => updateSetting('security', 'require_2fa_for_admin', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Allow Password Reset</p>
                          <p className="text-sm text-gray-600">Enable password reset via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.security.allow_password_reset}
                            onChange={(e) => updateSetting('security', 'allow_password_reset', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Email Settings */}
                  {activeTab === 'email' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SMTP Host
                          </label>
                          <input
                            type="text"
                            placeholder="smtp.example.com"
                            value={systemSettings.email.smtp_host}
                            onChange={(e) => updateSetting('email', 'smtp_host', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SMTP Port
                          </label>
                          <input
                            type="number"
                            value={systemSettings.email.smtp_port}
                            onChange={(e) => updateSetting('email', 'smtp_port', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <input
                          type="text"
                          value={systemSettings.email.smtp_user}
                          onChange={(e) => updateSetting('email', 'smtp_user', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Email
                          </label>
                          <input
                            type="email"
                            value={systemSettings.email.from_email}
                            onChange={(e) => updateSetting('email', 'from_email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Name
                          </label>
                          <input
                            type="text"
                            value={systemSettings.email.from_name}
                            onChange={(e) => updateSetting('email', 'from_name', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Use SSL/TLS</p>
                          <p className="text-sm text-gray-600">Secure email connection</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.email.smtp_secure}
                            onChange={(e) => updateSetting('email', 'smtp_secure', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Storage Settings */}
                  {activeTab === 'storage' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Settings</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max File Size (MB)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={systemSettings.storage.max_file_size}
                          onChange={(e) => updateSetting('storage', 'max_file_size', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allowed File Types
                        </label>
                        <input
                          type="text"
                          value={systemSettings.storage.allowed_file_types}
                          onChange={(e) => updateSetting('storage', 'allowed_file_types', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="pdf,doc,docx,xls,xlsx,png,jpg"
                        />
                        <p className="text-sm text-gray-500 mt-1">Comma-separated file extensions</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Storage Path
                        </label>
                        <input
                          type="text"
                          value={systemSettings.storage.storage_path}
                          onChange={(e) => updateSetting('storage', 'storage_path', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* API Settings */}
                  {activeTab === 'api' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">API Settings</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Limit (requests)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={systemSettings.api.rate_limit}
                          onChange={(e) => updateSetting('api', 'rate_limit', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Limit Window (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={systemSettings.api.rate_limit_window}
                          onChange={(e) => updateSetting('api', 'rate_limit_window', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">API Enabled</p>
                          <p className="text-sm text-gray-600">Allow API access to the system</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.api.api_enabled}
                            onChange={(e) => updateSetting('api', 'api_enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Azure DevOps Settings */}
                  {activeTab === 'azure' && (
                    <div className="space-y-6">
                      <div className="pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Cloud size={24} className="text-blue-600" />
                          Azure DevOps Integration
                        </h2>
                        <p className="text-gray-600 mt-2">Configure Azure DevOps connection for pushing stories</p>
                      </div>

                      <div className="space-y-6">
                        {/* Base URL */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Base URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="https://azure.2p.com.sa/"
                            value={azureSettings.baseUrl}
                            onChange={(e) => setAzureSettings({ ...azureSettings, baseUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-sm text-gray-600 mt-1">Your Azure DevOps server URL</p>
                        </div>

                        {/* Collection Name */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Collection Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Projects"
                            value={azureSettings.collection}
                            onChange={(e) => setAzureSettings({ ...azureSettings, collection: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-sm text-gray-600 mt-1">Your Azure DevOps collection name</p>
                        </div>

                        {/* PAT Token */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Personal Access Token (PAT) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={azureSettings.showPatToken ? 'text' : 'password'}
                              placeholder="Enter your Azure DevOps PAT"
                              value={azureSettings.patToken}
                              onChange={(e) => setAzureSettings({ ...azureSettings, patToken: e.target.value })}
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => setAzureSettings({ ...azureSettings, showPatToken: !azureSettings.showPatToken })}
                              className="absolute right-3 top-2.5 text-gray-600"
                            >
                              {azureSettings.showPatToken ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Create a PAT:</span> Azure DevOps → User Settings → Personal Access Tokens
                          </p>
                        </div>

                        {/* Connect & Load Projects Button */}
                        <button
                          onClick={loadAzureProjects}
                          disabled={!azureSettings.baseUrl.trim() || !azureSettings.collection.trim() || !azureSettings.patToken.trim() || azureSettings.testing}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                        >
                          {azureSettings.testing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Connecting & Loading Projects...
                            </>
                          ) : (
                            <>
                              <Cloud size={18} />
                              Connect & Load Projects
                            </>
                          )}
                        </button>

                        {/* Project Selection */}
                        {azureSettings.projects.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Select Project <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={azureSettings.selectedProject}
                              onChange={(e) => setAzureSettings({ ...azureSettings, selectedProject: e.target.value, project: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Choose a project...</option>
                              {azureSettings.projects.map(proj => (
                                <option key={proj.id} value={proj.id}>
                                  {proj.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-sm text-gray-600 mt-1">Select the project where stories will be pushed</p>
                          </div>
                        )}

                        {/* Save Configuration Button */}
                        {azureSettings.projects.length > 0 && azureSettings.selectedProject && (
                          <button
                            onClick={saveAzureConfiguration}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                          >
                            <Save size={18} />
                            Save Azure Configuration
                          </button>
                        )}

                        {/* Test Result Message */}
                        {azureSettings.testResult && (
                          <div
                            className={`p-4 rounded-lg border flex items-start gap-3 ${azureSettings.testResult.success
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                              }`}
                          >
                            {azureSettings.testResult.success ? (
                              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <p
                              className={
                                azureSettings.testResult.success
                                  ? 'text-green-800'
                                  : 'text-red-800'
                              }
                            >
                              {azureSettings.testResult.message}
                            </p>
                          </div>
                        )}

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium block mb-1">ℹ️ How it works:</span>
                            1. Enter your <strong>Azure DevOps server URL</strong> (e.g., https://azure.2p.com.sa/)<br />
                            2. Enter your <strong>Collection Name</strong> (e.g., Projects)<br />
                            3. Enter your <strong>Personal Access Token (PAT)</strong><br />
                            4. Click "<strong>Connect & Load Projects</strong>" - tests connection and fetches projects<br />
                            5. Select your <strong>project</strong> from the dropdown<br />
                            6. Click "<strong>Save Azure Configuration</strong>"<br />
                            <br />
                            Once configured, users can push AI-generated stories to Azure DevOps!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Slack & Teams Integration Tab */}
                  {activeTab === 'integrations' && (
                    <div className="space-y-8">
                      <div className="pb-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Communication Integrations</h3>
                        <p className="text-gray-600 mt-1">Connect Slack and Microsoft Teams for notifications and commands</p>
                      </div>

                      {/* Slack Integration */}
                      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#4A154B] rounded-lg">
                              <Hash size={24} className="text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Slack Integration</h4>
                              <p className="text-sm text-gray-600">Send notifications and use slash commands</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slackSettings.enabled}
                              onChange={(e) => setSlackSettings({ ...slackSettings, enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A154B]"></div>
                          </label>
                        </div>

                        {slackSettings.enabled && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Webhook URL <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="url"
                                placeholder="https://hooks.slack.com/services/..."
                                value={slackSettings.webhookUrl}
                                onChange={(e) => setSlackSettings({ ...slackSettings, webhookUrl: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A154B] focus:border-[#4A154B]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bot Token (Optional)
                              </label>
                              <div className="relative">
                                <input
                                  type={slackSettings.showToken ? 'text' : 'password'}
                                  placeholder="xoxb-your-bot-token"
                                  value={slackSettings.botToken}
                                  onChange={(e) => setSlackSettings({ ...slackSettings, botToken: e.target.value })}
                                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A154B]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSlackSettings({ ...slackSettings, showToken: !slackSettings.showToken })}
                                  className="absolute right-3 top-2.5 text-gray-600"
                                >
                                  {slackSettings.showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Required for slash commands (/brd, /story)</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Default Channel
                              </label>
                              <input
                                type="text"
                                placeholder="#general or #brds"
                                value={slackSettings.channel}
                                onChange={(e) => setSlackSettings({ ...slackSettings, channel: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A154B]"
                              />
                            </div>

                            <button
                              onClick={async () => {
                                setSlackSettings({ ...slackSettings, testing: true, testResult: null });
                                try {
                                  await api.post('/integrations/slack/test', { webhookUrl: slackSettings.webhookUrl });
                                  setSlackSettings({ ...slackSettings, testing: false, testResult: { success: true, message: 'Connection successful!' } });
                                } catch (err) {
                                  setSlackSettings({ ...slackSettings, testing: false, testResult: { success: false, message: err.response?.data?.error || 'Connection failed' } });
                                }
                              }}
                              disabled={!slackSettings.webhookUrl || slackSettings.testing}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4A154B] text-white rounded-lg hover:bg-[#3b1040] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                            >
                              {slackSettings.testing ? (
                                <><RefreshCw size={18} className="animate-spin" /> Testing...</>
                              ) : (
                                <><Zap size={18} /> Test Slack Connection</>
                              )}
                            </button>

                            {slackSettings.testResult && (
                              <div className={`p-3 rounded-lg flex items-center gap-2 ${slackSettings.testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {slackSettings.testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {slackSettings.testResult.message}
                              </div>
                            )}

                            <div className="p-3 bg-[#4A154B]/5 rounded-lg border border-[#4A154B]/20">
                              <p className="text-sm font-medium text-[#4A154B] mb-1">✨ Features:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                <li>• 📢 BRD/Story notifications</li>
                                <li>• ✅ Approve BRDs from Slack</li>
                                <li>• 🔍 /brd list and /story list commands</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Microsoft Teams Integration */}
                      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#5059C9] rounded-lg">
                              <MessageSquare size={24} className="text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Microsoft Teams Integration</h4>
                              <p className="text-sm text-gray-600">Send notifications and use adaptive cards</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={teamsSettings.enabled}
                              onChange={(e) => setTeamsSettings({ ...teamsSettings, enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5059C9]"></div>
                          </label>
                        </div>

                        {teamsSettings.enabled && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Incoming Webhook URL <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="url"
                                placeholder="https://outlook.office.com/webhook/..."
                                value={teamsSettings.webhookUrl}
                                onChange={(e) => setTeamsSettings({ ...teamsSettings, webhookUrl: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5059C9] focus:border-[#5059C9]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tenant ID (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="Your Azure AD Tenant ID"
                                value={teamsSettings.tenantId}
                                onChange={(e) => setTeamsSettings({ ...teamsSettings, tenantId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5059C9]"
                              />
                              <p className="text-xs text-gray-500 mt-1">Required for bot features and search</p>
                            </div>

                            <button
                              onClick={async () => {
                                setTeamsSettings({ ...teamsSettings, testing: true, testResult: null });
                                try {
                                  await api.post('/integrations/teams/test', { webhookUrl: teamsSettings.webhookUrl });
                                  setTeamsSettings({ ...teamsSettings, testing: false, testResult: { success: true, message: 'Connection successful!' } });
                                } catch (err) {
                                  setTeamsSettings({ ...teamsSettings, testing: false, testResult: { success: false, message: err.response?.data?.error || 'Connection failed' } });
                                }
                              }}
                              disabled={!teamsSettings.webhookUrl || teamsSettings.testing}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#5059C9] text-white rounded-lg hover:bg-[#4048b8] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                            >
                              {teamsSettings.testing ? (
                                <><RefreshCw size={18} className="animate-spin" /> Testing...</>
                              ) : (
                                <><Zap size={18} /> Test Teams Connection</>
                              )}
                            </button>

                            {teamsSettings.testResult && (
                              <div className={`p-3 rounded-lg flex items-center gap-2 ${teamsSettings.testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {teamsSettings.testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {teamsSettings.testResult.message}
                              </div>
                            )}

                            <div className="p-3 bg-[#5059C9]/5 rounded-lg border border-[#5059C9]/20">
                              <p className="text-sm font-medium text-[#5059C9] mb-1">✨ Features:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                <li>• 📢 Adaptive Cards for rich notifications</li>
                                <li>• 🔍 Search documents from Teams</li>
                                <li>• ✅ Approve/Reject BRDs via cards</li>
                                <li>• 📱 Custom tabs in channels</li>
                              </ul>
                            </div>

                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-800">
                                <strong>Setup:</strong> Teams channel → Connectors → Incoming Webhook → Copy URL
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    <RotateCcw size={18} />
                    <span>Reset to Defaults</span>
                  </button>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Toast {...toast} />
    </div>
  );
}
