import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle, Droplet, FileText, Plus } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { fetchUniversities, addUniversity as addNewUniversityApi } from '@/services/universityService';
import { fetchDepartments, addDepartment as addNewDepartmentApi } from '@/services/departmentService';

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
    university: '',
    department: '',
    bloodGroup: '',
    cnic: '',
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showNewUniversityInput, setShowNewUniversityInput] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [showNewDepartmentInput, setShowNewDepartmentInput] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      const [uniData, deptData] = await Promise.all([
        fetchUniversities(),
        fetchDepartments()
      ]);
      setUniversities(uniData);
      setDepartments(deptData);
    };
    loadInitialData();
  }, []);

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

    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required';
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
        let finalUniversity = formData.university;
        let finalDepartment = formData.department;

        if (showNewUniversityInput && newUniversityName.trim()) {
          try {
            const addedUni = await addNewUniversityApi(newUniversityName.trim(), token);
            finalUniversity = addedUni.name;
          } catch (err) {
            setApiError(err.message || 'Failed to add new university');
            setLoading(false);
            return;
          }
        }

        if (showNewDepartmentInput && newDepartmentName.trim()) {
          try {
            const addedDept = await addNewDepartmentApi(newDepartmentName.trim(), token);
            finalDepartment = addedDept.name;
          } catch (err) {
            setApiError(err.message || 'Failed to add new department');
            setLoading(false);
            return;
          }
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: `+92${formData.phone}`,
            bloodGroup: formData.bloodGroup,
            city: formData.city,
            address: formData.address,
            role: formData.role,
            permissions: formData.permissions,
            university: finalUniversity,
            department: finalDepartment,
            cnic: formData.cnic,
          })
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
              university: '',
              department: '',
              bloodGroup: '',
              cnic: '',
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
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) {
                      setFormData({ ...formData, phone: val });
                    }
                  }}
                  placeholder="3000000000"
                  className="flex-1 bg-transparent border-0 focus:ring-0 focus:border-0 text-red-900 dark:text-red-100"
                  required
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
            </div>

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
                className={`mt-2 w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none ${errors.bloodGroup ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {errors.bloodGroup && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.bloodGroup}</p>}
            </div>

            <div>
              <Label htmlFor="cnic" className="text-red-900 dark:text-red-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                CNIC Number
              </Label>
              <Input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="35202-1234567-8"
                className="mt-2 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
              />
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
                <Label htmlFor="university" className="text-red-900 dark:text-red-100">University (Optional)</Label>
                <select
                  id="university"
                  name="university"
                  value={showNewUniversityInput ? 'addNew' : formData.university}
                  onChange={(e) => {
                    if (e.target.value === 'addNew') {
                      setShowNewUniversityInput(true);
                      setFormData({ ...formData, university: '' });
                    } else {
                      setShowNewUniversityInput(false);
                      setFormData({ ...formData, university: e.target.value });
                    }
                  }}
                  className="mt-2 w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">Select University</option>
                  {universities.map(uni => (
                    <option key={uni._id || uni.name} value={uni.name}>{uni.name}</option>
                  ))}
                  <option value="addNew" className="font-bold text-red-600">+ Add New University</option>
                </select>

                {showNewUniversityInput && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Type new university name..."
                        value={newUniversityName}
                        onChange={(e) => setNewUniversityName(e.target.value)}
                        className="pr-10 bg-white dark:bg-red-900/50 border-red-400 focus:border-red-600"
                        autoFocus
                      />
                      <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-[10px] text-red-600 mt-1 italic">* This will be added to the global list.</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="department" className="text-red-900 dark:text-red-100">Department (Optional)</Label>
                <select
                  id="department"
                  name="department"
                  value={showNewDepartmentInput ? 'addNew' : formData.department}
                  onChange={(e) => {
                    if (e.target.value === 'addNew') {
                      setShowNewDepartmentInput(true);
                      setFormData({ ...formData, department: '' });
                    } else {
                      setShowNewDepartmentInput(false);
                      setFormData({ ...formData, department: e.target.value });
                    }
                  }}
                  className="mt-2 w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id || dept.name} value={dept.name}>{dept.name}</option>
                  ))}
                  <option value="addNew" className="font-bold text-red-600">+ Add New Department</option>
                </select>

                {showNewDepartmentInput && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Type new department name..."
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        className="pr-10 bg-white dark:bg-red-900/50 border-red-400 focus:border-red-600"
                        autoFocus
                      />
                      <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-[10px] text-red-600 mt-1 italic">* This will be added to the global list.</p>
                  </div>
                )}
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

