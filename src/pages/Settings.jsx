import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Bell, Lock, Shield, User, Mail, Moon, Sun, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user, token, refreshUser } = useAuth();
  const [settings, setSettings] = useState({
    theme: user?.theme || localStorage.getItem('theme') || 'light',
    emailNotifications: user?.emailNotifications ?? true,
    pushNotifications: user?.pushNotifications ?? true,
    profileVisibility: user?.profileVisibility ?? true,
  });

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        theme: user.theme || prev.theme,
        emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true,
        profileVisibility: user.profileVisibility ?? true,
      }));
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setErrorMessage("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    setErrorMessage("Notification permission denied. Please enable it in browser settings.");
    return false;
  };

  const handleSettingChange = async (key, value) => {
    if (key === 'pushNotifications' && value === true) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    setSettings({ ...settings, [key]: value });
    if (key === 'theme') {
      localStorage.setItem('theme', value);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!passwordRegex.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Must be 8+ chars with uppercase, digit & special char';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Your password has been changed successfully.");
        setShowSuccessModal(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        setErrorMessage(data.message || "Failed to change password");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!user?._id || !token) return;
    setIsSavingGeneral(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          theme: settings.theme,
        })
      });

      if (res.ok) {
        await refreshUser();
        setSuccessMessage("General settings saved successfully.");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Failed to save settings");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (err) {
      setErrorMessage("An error occurred while saving settings");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!user?._id || !token) return;
    setIsSavingNotifications(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
        })
      });

      if (res.ok) {
        await refreshUser();
        setSuccessMessage("Notification preferences updated.");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Failed to update notifications");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (err) {
      setErrorMessage("An error occurred while saving notifications");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    if (!user?._id || !token) return;
    setIsSavingPrivacy(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profileVisibility: settings.profileVisibility,
        })
      });

      if (res.ok) {
        await refreshUser();
        setSuccessMessage("Privacy settings updated.");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Failed to update privacy");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (err) {
      setErrorMessage("An error occurred while saving privacy");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
          Settings
        </h2>
        <p className="text-red-700 dark:text-red-300 text-sm md:text-base">Manage your account and application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4 text-red-600" />
                Theme
              </Label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-red-900 dark:text-red-100 mb-2">Language</Label>
              <select
                defaultValue="en"
                className="w-full px-3 py-2 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ur">Urdu (Coming Soon)</option>
              </select>
            </div>

            <Button
              onClick={handleSaveGeneralSettings}
              disabled={isSavingGeneral}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              {isSavingGeneral ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save General Settings
            </Button>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-600" />
            Notifications
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-red-900 dark:text-red-100">Email Notifications</span>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Receive updates via email</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-red-900 dark:text-red-100">Push Notifications</span>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Receive browser notifications</p>
              </div>
            </label>

            <Button
              onClick={handleSaveNotificationSettings}
              disabled={isSavingNotifications}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              {isSavingNotifications ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Notification Settings
            </Button>
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 lg:col-span-2">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-600" />
            Change Password
          </h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-2xl">
            <div>
              <Label htmlFor="currentPassword" className="text-red-900 dark:text-red-100">Current Password</Label>
              <Input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.currentPassword ? 'border-red-500' : ''}`}
                required
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.currentPassword}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword" className="text-red-900 dark:text-red-100">New Password</Label>
                <Input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="8+ chars, Uppercase, Digit, Symbol"
                  className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.newPassword ? 'border-red-500' : ''}`}
                  required
                />
                <p className="text-[10px] text-red-600/70 mt-1">Requires 8+ chars, 1 uppercase, 1 digit, 1 special char</p>
                {errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-red-900 dark:text-red-100">Confirm New Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="********"
                  className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white min-w-[150px]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </form>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 lg:col-span-2">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Privacy & Security
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.profileVisibility}
                onChange={(e) => handleSettingChange('profileVisibility', e.target.checked)}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-red-900 dark:text-red-100">Profile Visibility</span>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Allow other donors to find your profile</p>
              </div>
            </label>

            <Button
              onClick={handleSavePrivacySettings}
              disabled={isSavingPrivacy}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white min-w-[150px]"
            >
              {isSavingPrivacy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Privacy Settings
            </Button>

            <div className="pt-4 border-t border-red-200 dark:border-red-800">
              <Button variant="outline" className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50">
                Export My Data
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm p-8 bg-white dark:bg-red-950 border-red-200 text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-red-900 mb-2">Success!</h3>
            <p className="text-red-700">{successMessage}</p>
          </Card>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
