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
  Settings, Bell, Lock, Palette, Globe, Volume2, Shield, Mail, Phone, 
  Eye, EyeOff, Save, RotateCcw, AlertCircle, CheckCircle, Download, Moon, Sun,
  Smartphone, Monitor, Accessibility, MoreVertical, Trash2, Cloud, TestTube
} from 'lucide-react';
import * as azureApi from '@/lib/azure-api';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, success, error: showError } = useToast();

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email_login: true,
      email_security: true,
      email_updates: true,
      email_weekly: true,
      push_enabled: true,
      sms_enabled: false
    },
    privacy: {
      profile_public: false,
      show_online_status: true,
      allow_messages: true
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY'
    },
    accessibility: {
      high_contrast: false,
      reduce_motion: false,
      large_text: false,
      screen_reader: false
    },
    security: {
      two_factor: false,
      sessions_timeout: '30',
      remember_device: true
    }
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSettings();
    // تحميل Azure Settings من localStorage
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

  const fetchSettings = async () => {
    try {
      const response = await api.get('/user-settings').catch(() => null);
      if (response?.data?.data) {
        setSettings(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/user-settings', settings).catch(() => {});
      success('Settings saved successfully!');
    } catch (err) {
      showError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all settings to default?')) {
      try {
        setSaving(true);
        await api.post('/user-settings/reset').catch(() => {});
        fetchSettings();
        success('Settings reset to default');
      } catch (err) {
        showError('Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      showError('All fields are required');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      showError('Passwords do not match');
      return;
    }

    if (passwordData.new.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    try {
      await api.post('/profile/change-password', {
        oldPassword: passwordData.current,
        newPassword: passwordData.new,
        confirmPassword: passwordData.confirm
      });
      success('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowPasswordModal(false);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const updateNestedSetting = (section, key, value) => {
    setSettings(prev => ({
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
      
      // تطبيق الإعدادات واختبار الاتصال
      azureApi.setAzureConfig({
        baseUrl: azureSettings.baseUrl,
        collection: azureSettings.collection,
        project: 'temp',
      });
      azureApi.setAzurePAT(azureSettings.patToken);
      
      // اختبار الاتصال أولاً
      const testResult = await azureApi.testAzureConnection();
      
      if (!testResult.success) {
        setAzureSettings(prev => ({
          ...prev,
          testing: false,
          testResult: { success: false, message: testResult.error || 'Connection failed' }
        }));
        return;
      }
      
      // جلب المشاريع من Azure DevOps
      const projectsData = await azureApi.getAzureProjects();
      
      if (projectsData && projectsData.length > 0) {
        setAzureSettings(prev => ({
          ...prev,
          projects: projectsData,
          testing: false,
          testResult: { success: true, message: `${projectsData.length} projects loaded successfully from Azure DevOps` }
        }));
        // حفظ PAT بعد النجاح
        localStorage.setItem('azure_pat', azureSettings.patToken);
        success('Connected to Azure DevOps successfully!');
      } else {
        setAzureSettings(prev => ({
          ...prev,
          testing: false,
          testResult: { success: false, message: 'No projects found in Azure DevOps' }
        }));
      }
    } catch (err) {
      setAzureSettings(prev => ({
        ...prev,
        testing: false,
        testResult: { success: false, message: err.message || 'Failed to connect to Azure DevOps' }
      }));
    }
  };

  const saveAzureConfiguration = async () => {
    if (!azureSettings.project.trim()) {
      showError('Please select a project first');
      return;
    }
    
    // حفظ الإعدادات النهائية
    azureApi.setAzureConfig({
      baseUrl: azureSettings.baseUrl,
      collection: azureSettings.collection,
      project: azureSettings.project,
    });
    
    success('Azure DevOps settings saved successfully!');
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'azure', label: 'Azure DevOps', icon: Cloud }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Toast */}
              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type}
                  duration={toast.duration}
                  onClose={() => {}}
                />
              )}

              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Settings size={28} className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      My Settings
                    </h1>
                    <p className="text-gray-600">Personalize your account preferences</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6 space-y-2">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon size={18} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                      <div className="mb-6 pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Bell size={24} className="text-blue-600" />
                          Notification Preferences
                        </h2>
                        <p className="text-gray-600 mt-2">Choose how you want to be notified</p>
                      </div>

                      {/* Email Notifications */}
                      <div className="mb-8 pb-8 border-b">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                        <div className="space-y-4">
                          <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.email_login}
                              onChange={(e) => updateNestedSetting('notifications', 'email_login', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                            <div>
                              <p className="font-medium text-gray-900">Login Alerts</p>
                              <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.email_security}
                              onChange={(e) => updateNestedSetting('notifications', 'email_security', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                            <div>
                              <p className="font-medium text-gray-900">Security Updates</p>
                              <p className="text-sm text-gray-600">Important security alerts and recommendations</p>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.email_updates}
                              onChange={(e) => updateNestedSetting('notifications', 'email_updates', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                            <div>
                              <p className="font-medium text-gray-900">Product Updates</p>
                              <p className="text-sm text-gray-600">New features and improvements</p>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.email_weekly}
                              onChange={(e) => updateNestedSetting('notifications', 'email_weekly', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                            <div>
                              <p className="font-medium text-gray-900">Weekly Summary</p>
                              <p className="text-sm text-gray-600">Activity summary every Monday morning</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Push & SMS */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Notifications</h3>
                        <div className="space-y-4">
                          <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.push_enabled}
                              onChange={(e) => updateNestedSetting('notifications', 'push_enabled', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                            <div>
                              <p className="font-medium text-gray-900">Push Notifications</p>
                              <p className="text-sm text-gray-600">Browser and mobile push notifications</p>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications.sms_enabled}
                              onChange={(e) => updateNestedSetting('notifications', 'sms_enabled', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                            />
                            <div>
                              <p className="font-medium text-gray-900">SMS Alerts</p>
                              <p className="text-sm text-gray-600">Critical alerts via SMS (may incur charges)</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display Tab */}
                  {activeTab === 'display' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                      <div className="mb-6 pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Palette size={24} className="text-purple-600" />
                          Display Settings
                        </h2>
                      </div>

                      {/* Theme */}
                      <div className="mb-8 pb-8 border-b">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
                        <div className="flex gap-4">
                          {['light', 'dark'].map(mode => (
                            <button
                              key={mode}
                              onClick={() => updateNestedSetting('display', 'theme', mode)}
                              className={`flex-1 p-6 rounded-lg border-2 font-medium transition ${
                                settings.display.theme === mode
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {mode === 'light' ? <Sun size={24} className="mx-auto mb-2" /> : <Moon size={24} className="mx-auto mb-2" />}
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="mb-8 pb-8 border-b">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Language</h3>
                        <select
                          value={settings.display.language}
                          onChange={(e) => updateNestedSetting('display', 'language', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="en">English</option>
                          <option value="ar">العربية (Arabic)</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="zh">中文</option>
                        </select>
                      </div>

                      {/* Timezone */}
                      <div className="mb-8 pb-8 border-b">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timezone</h3>
                        <select
                          value={settings.display.timezone}
                          onChange={(e) => updateNestedSetting('display', 'timezone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="GMT">GMT</option>
                          <option value="EST">EST (Eastern Standard Time)</option>
                          <option value="CST">CST (Central Standard Time)</option>
                          <option value="MST">MST (Mountain Standard Time)</option>
                          <option value="PST">PST (Pacific Standard Time)</option>
                          <option value="CET">CET (Central European Time)</option>
                          <option value="GST">GST (Gulf Standard Time)</option>
                          <option value="IST">IST (Indian Standard Time)</option>
                        </select>
                      </div>

                      {/* Date Format */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Format</h3>
                        <select
                          value={settings.display.date_format}
                          onChange={(e) => updateNestedSetting('display', 'date_format', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Privacy Tab */}
                  {activeTab === 'privacy' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                      <div className="mb-6 pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Shield size={24} className="text-green-600" />
                          Privacy Settings
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.profile_public}
                            onChange={(e) => updateNestedSetting('privacy', 'profile_public', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Public Profile</p>
                            <p className="text-sm text-gray-600">Allow others to view your profile</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.show_online_status}
                            onChange={(e) => updateNestedSetting('privacy', 'show_online_status', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Show Online Status</p>
                            <p className="text-sm text-gray-600">Let others see when you're online</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.allow_messages}
                            onChange={(e) => updateNestedSetting('privacy', 'allow_messages', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Allow Direct Messages</p>
                            <p className="text-sm text-gray-600">Let others send you direct messages</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Accessibility Tab */}
                  {activeTab === 'accessibility' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8">
                      <div className="mb-6 pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Accessibility size={24} className="text-orange-600" />
                          Accessibility Settings
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.accessibility.high_contrast}
                            onChange={(e) => updateNestedSetting('accessibility', 'high_contrast', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">High Contrast Mode</p>
                            <p className="text-sm text-gray-600">Increase color contrast for better visibility</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.accessibility.reduce_motion}
                            onChange={(e) => updateNestedSetting('accessibility', 'reduce_motion', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Reduce Motion</p>
                            <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.accessibility.large_text}
                            onChange={(e) => updateNestedSetting('accessibility', 'large_text', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Large Text</p>
                            <p className="text-sm text-gray-600">Increase font size throughout the app</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.accessibility.screen_reader}
                            onChange={(e) => updateNestedSetting('accessibility', 'screen_reader', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Screen Reader Support</p>
                            <p className="text-sm text-gray-600">Optimize for screen readers</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
                      <div className="pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Lock size={24} className="text-red-600" />
                          Security Settings
                        </h2>
                      </div>

                      {/* Two Factor */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                          <p className="text-sm text-blue-900">Two-factor authentication adds an extra layer of security to your account.</p>
                        </div>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.security.two_factor}
                            onChange={(e) => updateNestedSetting('security', 'two_factor', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Enable 2FA</p>
                            <p className="text-sm text-gray-600">Require code from authenticator app on login</p>
                          </div>
                        </label>
                      </div>

                      {/* Password */}
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Management</h3>
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                        >
                          <Lock size={16} className="inline mr-2" />
                          Change Password
                        </button>
                      </div>

                      {/* Session Timeout */}
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Management</h3>
                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Session Timeout (minutes)</label>
                          <input
                            type="number"
                            value={settings.security.sessions_timeout}
                            onChange={(e) => updateNestedSetting('security', 'sessions_timeout', e.target.value)}
                            min="5"
                            max="1440"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-sm text-gray-600 mt-2">Automatically logout after this period of inactivity</p>
                        </div>
                        <label className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.security.remember_device}
                            onChange={(e) => updateNestedSetting('security', 'remember_device', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-medium text-gray-900">Remember This Device</p>
                            <p className="text-sm text-gray-600">Skip 2FA verification on trusted devices</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Azure DevOps Tab */}
                  {activeTab === 'azure' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
                      <div className="pb-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Cloud size={24} className="text-blue-600" />
                          Azure DevOps Integration
                        </h2>
                        <p className="text-gray-600 mt-2">Configure your Azure DevOps settings to push stories and sync with your projects</p>
                      </div>

                      <div className="space-y-6">
                        {/* Base URL */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Base URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="https://azure.2p.com.sa"
                            value={azureSettings.baseUrl}
                            onChange={(e) => setAzureSettings({ ...azureSettings, baseUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                            <span className="font-medium">Create a PAT:</span> Go to Azure DevOps → User Settings → Personal Access Tokens
                          </p>
                        </div>

                        {/* Load Projects Button */}
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                            className={`p-4 rounded-lg border flex items-start gap-3 ${
                              azureSettings.testResult.success
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
                            1. Enter your <strong>Azure DevOps server URL</strong> (e.g., https://azure.2p.com.sa/)<br/>
                            2. Enter your <strong>Collection Name</strong> (e.g., Projects)<br/>
                            3. Enter your <strong>Personal Access Token (PAT)</strong><br/>
                            4. Click "<strong>Connect & Load Projects</strong>" - this will test the connection and fetch all projects<br/>
                            5. Select your <strong>project</strong> from the dropdown list<br/>
                            6. Click "<strong>Save Azure Configuration</strong>"<br/>
                            <br/>
                            Once configured, you can push AI-generated stories directly to Azure DevOps from the AI Stories page!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save & Reset Buttons */}
                  <div className="flex gap-3 sticky bottom-6 bg-white rounded-xl border border-gray-200 p-6">
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition font-medium"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                      <RotateCcw size={18} />
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Change Modal */}
              {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Lock size={24} />
                      Change Password
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? 'text' : 'password'}
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            className="absolute right-3 top-2.5 text-gray-600"
                          >
                            {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? 'text' : 'password'}
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                            className="absolute right-3 top-2.5 text-gray-600"
                          >
                            {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                            className="absolute right-3 top-2.5 text-gray-600"
                          >
                            {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                        >
                          Change Password
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordModal(false)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
