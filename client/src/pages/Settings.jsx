import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Moon,
  Sun,
  Languages,
  DollarSign,
  Bell,
  Shield,
  Save,
  Upload,
  Download,
  Lock,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import InputField from '../components/InputField';
import CheckboxField from '../components/CheckboxField';
import ActionButton from '../components/ActionButton';
import UnauthorizedModal from '../components/UnauthorizedModal';
import 'react-toastify/dist/ReactToastify.css';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    companySettings: {},
    systemPreferences: {},
    notificationSettings: {},
    securitySettings: {},
    userProfile: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
    fetchSettings();
  }, []);

  const checkAuthorization = () => {
    // Get user role from localStorage or sessionStorage
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      setIsUnauthorized(true);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      // Ensure all grouped properties exist
      const completeData = {
        companySettings: data.companySettings || {},
        systemPreferences: data.systemPreferences || {},
        notificationSettings: data.notificationSettings || {},
        securitySettings: data.securitySettings || {},
        userProfile: data.userProfile || {}
      };
      setSettings(completeData);
      toast.success('Settings loaded successfully');
    } catch (error) {
      toast.error(error.message || 'Error loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupData = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch settings for backup');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'settings-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup created successfully');
    } catch (error) {
      toast.error(error.message || 'Error creating backup');
    }
  };

  const handleRestoreData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsedData = JSON.parse(content);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedData)
      });
      if (!response.ok) throw new Error('Failed to restore settings');
      setSettings(parsedData);
      toast.success('Settings restored successfully');
    } catch (error) {
      toast.error(error.message || 'Error restoring settings');
    }
  };

  const handleChangePassword = () => {
    if (settings.userProfile.newPassword !== settings.userProfile.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password changed successfully');
    setSettings({
      ...settings,
      userProfile: {
        ...settings.userProfile,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          companySettings: { ...settings.companySettings, logo: reader.result }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading settings...</div>;
  }

  return (
    <>
      <UnauthorizedModal isOpen={isUnauthorized} />
      <div className={`container mx-auto px-4 py-8 ${isUnauthorized ? 'pointer-events-none opacity-50' : ''}`}>
        <ToastContainer position="top-right" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">Manage your system preferences and configurations</p>
        </div>

        {/* Settings Navigation */}
        <div className="flex mb-8">
          <div className="w-64 mr-8">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="inline-block w-5 h-5 mr-2" />
                  General Settings
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <User className="inline-block w-5 h-5 mr-2" />
                  User Profile
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'system' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Sun className="inline-block w-5 h-5 mr-2" />
                  System Preferences
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Bell className="inline-block w-5 h-5 mr-2" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Shield className="inline-block w-5 h-5 mr-2" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('backup')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    activeTab === 'backup' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <Save className="inline-block w-5 h-5 mr-2" />
                  Backup & Restore
                </button>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        <img
                          src={settings.companySettings?.logo || 'https://via.placeholder.com/150'} // Fallback placeholder if logo undefined
                          alt="Company Logo"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <label className="cursor-pointer bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100">
                          <Upload className="inline-block w-5 h-5 mr-2" />
                          Upload New Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <InputField
                      label="Company Name"
                      value={settings.companySettings.name || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companySettings: { ...settings.companySettings, name: e.target.value }
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Email Address"
                        type="email"
                        value={settings.companySettings.email || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            companySettings: { ...settings.companySettings, email: e.target.value }
                          })
                        }
                      />
                      <InputField
                        label="Phone Number"
                        type="tel"
                        value={settings.companySettings.phone || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            companySettings: { ...settings.companySettings, phone: e.target.value }
                          })
                        }
                      />
                    </div>
                    <InputField
                      label="Address"
                      type="textarea"
                      value={settings.companySettings.address || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companySettings: { ...settings.companySettings, address: e.target.value }
                        })
                      }
                      rows={3}
                    />
                    <InputField
                      label="Website"
                      type="url"
                      value={settings.companySettings.website || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          companySettings: { ...settings.companySettings, website: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">User Profile</h2>
                  <div className="space-y-6">
                    <InputField
                      label="Email Address"
                      type="email"
                      value={settings.userProfile.email || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          userProfile: { ...settings.userProfile, email: e.target.value }
                        })
                      }
                    />
                    <InputField
                      label="Current Password"
                      type="password"
                      value={settings.userProfile.currentPassword || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          userProfile: { ...settings.userProfile, currentPassword: e.target.value }
                        })
                      }
                    />
                    <InputField
                      label="New Password"
                      type="password"
                      value={settings.userProfile.newPassword || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          userProfile: { ...settings.userProfile, newPassword: e.target.value }
                        })
                      }
                    />
                    <InputField
                      label="Confirm New Password"
                      type="password"
                      value={settings.userProfile.confirmPassword || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          userProfile: { ...settings.userProfile, confirmPassword: e.target.value }
                        })
                      }
                    />
                    <ActionButton
                      label="Change Password"
                      icon={Lock}
                      onClick={handleChangePassword}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">System Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setSettings({ ...settings, systemPreferences: { ...settings.systemPreferences, theme: 'light' } })}
                          className={`flex items-center px-4 py-2 rounded-lg ${
                            settings.systemPreferences.theme === 'light'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <Sun className="w-5 h-5 mr-2" />
                          Light
                        </button>
                        <button
                          onClick={() => setSettings({ ...settings, systemPreferences: { ...settings.systemPreferences, theme: 'dark' } })}
                          className={`flex items-center px-4 py-2 rounded-lg ${
                            settings.systemPreferences.theme === 'dark'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <Moon className="w-5 h-5 mr-2" />
                          Dark
                        </button>
                        <button
                          onClick={() => setSettings({ ...settings, systemPreferences: { ...settings.systemPreferences, theme: 'system' } })}
                          className={`flex items-center px-4 py-2 rounded-lg ${
                            settings.systemPreferences.theme === 'system'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <Settings className="w-5 h-5 mr-2" />
                          System
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <DollarSign className="inline-block w-5 h-5 mr-2" />
                          Currency
                        </label>
                        <select
                          value={settings.systemPreferences.currency || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              systemPreferences: { ...settings.systemPreferences, currency: e.target.value }
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Languages className="inline-block w-5 h-5 mr-2" />
                          Language
                        </label>
                        <select
                          value={settings.systemPreferences.language || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              systemPreferences: { ...settings.systemPreferences, language: e.target.value }
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {languages.map((language) => (
                            <option key={language} value={language}>
                              {language}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline-block w-5 h-5 mr-2" />
                          Date Format
                        </label>
                        <select
                          value={settings.systemPreferences.dateFormat || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              systemPreferences: { ...settings.systemPreferences, dateFormat: e.target.value }
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {dateFormats.map((format) => (
                            <option key={format} value={format}>
                              {format}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="inline-block w-5 h-5 mr-2" />
                          Time Format
                        </label>
                        <select
                          value={settings.systemPreferences.timeFormat || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              systemPreferences: { ...settings.systemPreferences, timeFormat: e.target.value }
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="12h">12-hour</option>
                          <option value="24h">24-hour</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Notification Settings</h2>
                  <div className="space-y-4">
                    <CheckboxField
                      label="Email Notifications"
                      checked={settings.notificationSettings.emailNotifications || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationSettings: { ...settings.notificationSettings, emailNotifications: e.target.checked }
                        })
                      }
                    />
                    <CheckboxField
                      label="Push Notifications"
                      checked={settings.notificationSettings.pushNotifications || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationSettings: { ...settings.notificationSettings, pushNotifications: e.target.checked }
                        })
                      }
                    />
                    <CheckboxField
                      label="Low Stock Alerts"
                      checked={settings.notificationSettings.lowStockAlerts || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationSettings: { ...settings.notificationSettings, lowStockAlerts: e.target.checked }
                        })
                      }
                    />
                    <CheckboxField
                      label="Daily Reports"
                      checked={settings.notificationSettings.dailyReports || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationSettings: { ...settings.notificationSettings, dailyReports: e.target.checked }
                        })
                      }
                    />
                    <CheckboxField
                      label="Security Alerts"
                      checked={settings.notificationSettings.securityAlerts || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationSettings: { ...settings.notificationSettings, securityAlerts: e.target.checked }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <CheckboxField
                      label="Two-Factor Authentication"
                      checked={settings.securitySettings.twoFactorAuth || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          securitySettings: { ...settings.securitySettings, twoFactorAuth: e.target.checked }
                        })
                      }
                    />
                    <InputField
                      label="Session Timeout (minutes)"
                      type="number"
                      value={settings.securitySettings.sessionTimeout || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          securitySettings: { ...settings.securitySettings, sessionTimeout: parseInt(e.target.value) }
                        })
                      }
                    />
                    <InputField
                      label="Password Expiry (days)"
                      type="number"
                      value={settings.securitySettings.passwordExpiry || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          securitySettings: { ...settings.securitySettings, passwordExpiry: parseInt(e.target.value) }
                        })
                      }
                    />
                    <InputField
                      label="Maximum Login Attempts"
                      type="number"
                      value={settings.securitySettings.loginAttempts || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          securitySettings: { ...settings.securitySettings, loginAttempts: parseInt(e.target.value) }
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'backup' && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Backup & Restore</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Backup Data</h3>
                      <p className="text-gray-600 mb-4">
                        Download a backup of your settings and data
                      </p>
                      <ActionButton
                        label="Download Backup"
                        icon={Download}
                        onClick={handleBackupData}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      />
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Restore Data</h3>
                      <p className="text-gray-600 mb-4">
                        Restore your settings from a backup file
                      </p>
                      <label className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Backup
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleRestoreData}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'backup' && (
                <div className="mt-6 flex justify-end">
                  <ActionButton
                    label={isSaving ? 'Saving...' : 'Save Changes'}
                    icon={Save}
                    onClick={handleSaveSettings}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
