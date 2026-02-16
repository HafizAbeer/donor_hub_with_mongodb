import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Droplet, Calendar, MapPin, Phone, Mail, Save, Heart, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReactCountryFlag from 'react-country-flag';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function UserProfile() {
  const { user, token, refreshUser } = useAuth();
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize form data from user, with fallbacks
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    dateOfBirth: '',
    address: '',
    city: '',
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        address: user.address || '',
        city: user.city || '',
      });
    }
  }, [user]);

  useEffect(() => {
    fetchDonations();
  }, [token]);

  const fetchDonations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/donations/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyDonations(data);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id || !token) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await refreshUser();
        setSuccessMessage("Your profile has been updated successfully.");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Update failed");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMessage("An error occurred while updating profile");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Calculate dynamic stats
  const totalDonations = myDonations.length;
  const pointsEarned = totalDonations * 50;

  const getLastDonationText = () => {
    if (myDonations.length === 0) return 'Never';
    const sorted = [...myDonations].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastDate = new Date(sorted[0].date);
    const now = new Date();
    const diffMonths = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());

    if (diffMonths === 0) {
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      return diffDays === 0 ? 'Today' : `${diffDays} days ago`;
    }
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  // Process data for chart (Last 6 months)
  const getChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const history = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = `${months[d.getMonth()]} ${d.getFullYear()}`;

      const count = myDonations.filter(don => {
        const donDate = new Date(don.date);
        return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
      }).length;

      history.push({ month: monthLabel, donations: count });
    }

    return history;
  };

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    pushNotifications: user?.pushNotifications ?? true,
  });

  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      setNotificationSettings({
        emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true,
      });
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setErrorMessage("This browser does not support desktop notification");
      return false;
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    setErrorMessage("Notification permission denied.");
    return false;
  };

  const handleNotificationToggle = async (key, value) => {
    if (key === 'pushNotifications' && value === true) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNotifications = async () => {
    if (!user?._id || !token) return;
    setIsSavingNotifications(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationSettings),
      });

      if (res.ok) {
        await refreshUser();
        setSuccessMessage("Notification preferences updated.");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Failed to update notifications");
      }
    } catch (err) {
      setErrorMessage("An error occurred");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
          <UserCircle className="w-8 h-8 text-red-600" />
          My Profile
        </h2>
        <p className="text-red-700 dark:text-red-300">Update your personal information and donation details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
              </div>
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-1">{formData.name || 'User'}</h3>
              <p className="text-red-700 dark:text-red-400 mb-4">{formData.email}</p>
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                <Droplet className="w-5 h-5" />
                <span className="text-lg font-semibold">{formData.bloodGroup || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Total Donations</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{totalDonations}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Last Donation</p>
                <p className="text-lg font-semibold text-red-900 dark:text-red-100">{getLastDonationText()}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Points Earned</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100 flex items-center gap-1">
                  <Award className="w-5 h-5 text-pink-600" />
                  {pointsEarned}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Quick Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <span className="text-sm text-red-900 dark:text-red-100">Email Alerts</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => handleNotificationToggle('emailNotifications', e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <span className="text-sm text-red-900 dark:text-red-100">Push Alerts</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => handleNotificationToggle('pushNotifications', e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
              </div>
              <Button
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
                size="sm"
                className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
              >
                {isSavingNotifications ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Sync Notifications
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="name" className="text-red-900 dark:text-red-100">Full Name</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-red-900 dark:text-red-100">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="mt-2 bg-gray-100 dark:bg-red-900/10 border-red-300 dark:border-red-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-red-900 dark:text-red-100">Phone Number</Label>
                <div className="mt-2 flex items-center bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                  <div className="flex items-center gap-2 px-3 py-2 border-r border-red-300 dark:border-red-800">
                    <ReactCountryFlag
                      countryCode="PK"
                      svg
                      style={{ width: "20px", height: "20px", borderRadius: "3px" }}
                    />
                    <span className="text-red-900 dark:text-red-100 text-sm">+92</span>
                  </div>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="3000000000"
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus:border-0 text-red-900 dark:text-red-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="bloodGroup" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-red-600" />
                    Blood Group
                  </Label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="mt-2 w-full px-3 py-2 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Date of Birth
                  </Label>
                  <Input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Address
                </Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-red-900 dark:text-red-100">City</Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
              >
                {isSaving ? (
                  <>Updating...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Donation History Chart
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" />
                <XAxis dataKey="month" stroke="#991b1b" />
                <YAxis stroke="#991b1b" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #fecdd3', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="donations" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Donations" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Recent Donations
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {myDonations.length > 0 ? (
                myDonations.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((donation) => (
                  <div key={donation._id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">{donation.location}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-red-600 dark:text-red-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(donation.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          +50 pts
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                      completed
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-red-500 py-4 italic">No donations yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
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

      {/* Error Message (Toast style) */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}


