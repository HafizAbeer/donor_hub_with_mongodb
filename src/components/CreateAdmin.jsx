import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';

export default function CreateAdmin() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    role: 'admin',
    permissions: {
      manageUsers: true,
      manageDonors: true,
      viewReports: true,
    },
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Must be 8+ chars with uppercase, digit & special char';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      setApiError('');
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setFormData({
              name: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              address: '',
              city: '',
              permissions: {
                manageUsers: true,
                manageDonors: true,
                viewReports: true,
              },
            });
          }, 2000);
        } else {
          setApiError(data.message || 'Failed to create admin');
        }
      } catch (err) {
        setApiError('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission],
      },
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
          Create Admin
        </h2>
        <p className="text-red-700 dark:text-red-300 text-sm md:text-base">Create a new admin account with specific permissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <Label htmlFor="name" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  Full Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.name ? 'border-red-500' : ''}`}
                  required
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600" />
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600" />
                Phone Number
              </Label>
              <div className={`mt-2 flex items-center bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 ${errors.phone ? 'border-red-500' : ''}`}>
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
              {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <Label htmlFor="city" className="text-red-900 dark:text-red-100">City</Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Lahore"
                  className="mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  Account Role
                </Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <Label htmlFor="password" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="8+ chars, Uppercase, Digit, Symbol"
                  className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <p className="text-[10px] text-red-600/70 mt-1">Requires 8+ chars, 1 uppercase, 1 digit, 1 special char</p>
                {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-red-900 dark:text-red-100">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="********"
                  className={`mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirmPassword}</p>}
              </div>
            </div>

            {apiError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                <span>{apiError}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                <span>Admin created successfully!</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </form>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Permissions</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.permissions.manageUsers}
                onChange={() => handlePermissionChange('manageUsers')}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-red-900 dark:text-red-100">Manage Users</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.permissions.manageDonors}
                onChange={() => handlePermissionChange('manageDonors')}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-red-900 dark:text-red-100">Manage Donors</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.permissions.viewReports}
                onChange={() => handlePermissionChange('viewReports')}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-red-900 dark:text-red-100">View Reports</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}

