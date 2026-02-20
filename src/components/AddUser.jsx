import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, Transition } from '@headlessui/react';
import {
  UserPlus, Calendar, Droplet, MapPin, Mail, Phone, User,
  AlertCircle, CheckCircle, FileText, Heart, Home, X, CheckCircle2, Info, Plus
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { fetchUniversities, addUniversity as addNewUniversityApi } from '@/services/universityService';
import { fetchDepartments, addDepartment as addNewDepartmentApi } from '@/services/departmentService';

export default function AddUser() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: 'Punjab',
    gender: '',
    cnic: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    allergies: '',
    lastDonation: '',
    hostelite: false,
    password: '',
    university: '',
    department: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

  const navigate = useNavigate();
  const { token } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits (e.g., 3001234567)';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else {
      const pass = formData.password;
      const hasUpper = /[A-Z]/.test(pass);
      const hasNumber = /\d/.test(pass);
      const hasSpecial = /[@$!%*?&]/.test(pass);
      const isLongEnough = pass.length >= 8;

      if (!isLongEnough || !hasUpper || !hasNumber || !hasSpecial) {
        newErrors.password = 'Password must be at least 8 characters, include an uppercase letter, a digit, and a special character (@$!%*?&)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        let finalUniversity = formData.university;
        let finalDepartment = formData.department;

        if (showNewUniversityInput && newUniversityName.trim()) {
          try {
            const addedUni = await addNewUniversityApi(newUniversityName.trim(), token);
            finalUniversity = addedUni.name;
          } catch (err) {
            setErrorMessage(err.message || 'Failed to add new university');
            setIsSubmitting(false);
            return;
          }
        }

        if (showNewDepartmentInput && newDepartmentName.trim()) {
          try {
            const addedDept = await addNewDepartmentApi(newDepartmentName.trim(), token);
            finalDepartment = addedDept.name;
          } catch (err) {
            setErrorMessage(err.message || 'Failed to add new department');
            setIsSubmitting(false);
            return;
          }
        }

        const userData = {
          ...formData,
          phone: `+92${formData.phone}`,
          emergencyPhone: formData.emergencyPhone ? `+92${formData.emergencyPhone}` : '',
          university: finalUniversity,
          department: finalDepartment,
          role: 'user',
          lastDonationDate: formData.lastDonation || null,
        };

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to create user');
        }

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/donors');
        }, 2000);
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const provinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir'];
  const genders = ['Male', 'Female', 'Other'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
          <UserPlus className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
          Add User
        </h2>
        <p className="text-red-700 dark:text-red-300 text-sm md:text-base">Register a new donor with comprehensive information</p>
      </div>

      <Card className="p-4 md:p-8 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 shadow-xl rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2 border-b border-red-100 dark:border-red-900 pb-2">
              <User className="w-5 h-5 text-red-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-red-900 dark:text-red-100">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800 ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                  required
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-900 dark:text-red-100">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800 ${errors.email ? 'border-red-500 ring-red-500' : ''}`}
                  required
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="This password will be used for first-time login" className="text-red-900 dark:text-red-100 flex items-center gap-1.5 cursor-help">
                  Set Password *
                  <Info className="w-3.5 h-3.5 text-red-400" />
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="e.g. UserPass123"
                    className={`bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800 pr-10 ${errors.password ? 'border-red-500 ring-red-500' : ''}`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-300">
                    <CheckCircle className={`w-4 h-4 ${formData.password.length >= 8 &&
                      /[A-Z]/.test(formData.password) &&
                      /\d/.test(formData.password) &&
                      /[@$!%*?&]/.test(formData.password)
                      ? 'text-green-500' : 'opacity-20'
                      }`} />
                  </div>
                </div>
                <div className="mt-1.5 space-y-1">
                  {errors.password && <p className="text-[11px] text-red-500 font-medium">{errors.password}</p>}
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Info className="w-2.5 h-2.5" />
                    Requirements: 8+ chars, 1 Uppercase, 1 Digit, 1 Special (@$!%*?&)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-red-900 dark:text-red-100">Phone Number *</Label>
                <div className={`flex items-center bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md focus-within:ring-2 focus-within:ring-red-500 transition-all ${errors.phone ? 'border-red-500' : ''}`}>
                  <div className="flex items-center gap-1.5 px-3 py-2 border-r border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-900/20">
                    <ReactCountryFlag countryCode="PK" svg style={{ width: "18px" }} />
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">+92</span>
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) {
                        setFormData({ ...formData, phone: val });
                      }
                    }}
                    placeholder="3001234567"
                    className="border-0 focus:ring-0 shadow-none bg-transparent"
                    required
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnic" className="text-red-900 dark:text-red-100">CNIC (Optional)</Label>
                <Input
                  id="cnic"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  placeholder="35202-1234567-8"
                  className="bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2 border-b border-red-100 dark:border-red-900 pb-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Demographic & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup" className="text-red-900 dark:text-red-100">Blood Group *</Label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:ring-2 focus:ring-red-500 outline-none ${errors.bloodGroup ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="" disabled className="dark:bg-slate-900">Select Group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg} className="dark:bg-slate-900">{bg}</option>
                  ))}
                </select>
                {errors.bloodGroup && <p className="text-xs text-red-500 mt-1">{errors.bloodGroup}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-red-900 dark:text-red-100">Gender</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="" disabled className="dark:bg-slate-900">Select Gender</option>
                  {genders.map((g) => (
                    <option key={g} value={g} className="dark:bg-slate-900">{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 border-red-200 dark:border-red-800">
                <Label htmlFor="dateOfBirth" className="text-red-900 dark:text-red-100">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
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
                  className="w-full px-3 py-2 bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="" className="dark:bg-slate-900">Select University</option>
                  {universities.map(uni => (
                    <option key={uni._id || uni.name} value={uni.name} className="dark:bg-slate-900">{uni.name}</option>
                  ))}
                  <option value="addNew" className="font-bold text-red-600 dark:bg-slate-900">+ Add New University</option>
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

              <div className="space-y-2">
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
                  className="w-full px-3 py-2 bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="" className="dark:bg-slate-900">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id || dept.name} value={dept.name} className="dark:bg-slate-900">{dept.name}</option>
                  ))}
                  <option value="addNew" className="font-bold text-red-600 dark:bg-slate-900">+ Add New Department</option>
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

              <div className="space-y-2">
                <Label htmlFor="province" className="text-red-900 dark:text-red-100">Province</Label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {provinces.map((p) => (
                    <option key={p} value={p} className="dark:bg-slate-900">{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-red-900 dark:text-red-100">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Faisalabad"
                  className={`bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800 ${errors.city ? 'border-red-500' : ''}`}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-red-900 dark:text-red-100">Detailed Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House #123, Street #4, Sector X..."
                className={`bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800 ${errors.address ? 'border-red-500' : ''}`}
                required
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/50 mt-2">
              <div className="flex items-center h-5">
                <input
                  id="hostelite"
                  name="hostelite"
                  type="checkbox"
                  checked={formData.hostelite}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-red-600" />
                <Label htmlFor="hostelite" className="text-sm font-medium text-red-900 dark:text-red-100 cursor-pointer">
                  User is a Hostelite (Resident of Hostel)
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2 border-b border-red-100 dark:border-red-900 pb-2">
              <Heart className="w-5 h-5 text-red-600" />
              Medical History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="medicalConditions" className="text-red-900 dark:text-red-100">Medical Conditions</Label>
                <Input
                  id="medicalConditions"
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  placeholder="e.g. None, Hypertension"
                  className="bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies" className="text-red-900 dark:text-red-100">Allergies</Label>
                <Input
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Penicillin, Pollen"
                  className="bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastDonation" className="text-red-900 dark:text-red-100">Last Donation Date (If any)</Label>
                <Input
                  id="lastDonation"
                  name="lastDonation"
                  type="date"
                  value={formData.lastDonation}
                  onChange={handleChange}
                  className="bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2 border-b border-red-100 dark:border-red-900 pb-2">
              <Phone className="w-5 h-5 text-red-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-red-900 dark:text-red-100">Contact Person Name</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Next of kin"
                  className="bg-white dark:bg-red-900/10 border-red-200 dark:border-red-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone" className="text-red-900 dark:text-red-100">Emergency Phone</Label>
                <div className="flex items-center bg-white dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md ring-inset transition-all">
                  <div className="flex items-center gap-1.5 px-3 py-2 border-r border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-900/20">
                    <ReactCountryFlag countryCode="PK" svg style={{ width: "18px" }} />
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">+92</span>
                  </div>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) {
                        setFormData({ ...formData, emergencyPhone: val });
                      }
                    }}
                    placeholder="3123456789"
                    className="border-0 focus:ring-0 shadow-none bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-800 dark:text-red-200 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Error saving user</p>
                <p className="text-sm opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-200 dark:shadow-none transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create User Account
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Transition appear show={showSuccess} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => { }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-8 text-center shadow-2xl transition-all border border-red-50 dark:border-red-900">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-red-900 dark:text-red-100 mb-2"
                  >
                    User Created!
                  </Dialog.Title>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-6">
                    The donor profile has been successfully registered. Redirecting to donors list...
                  </p>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full animate-[progress_2s_linear]"></div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
