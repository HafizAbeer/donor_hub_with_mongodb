import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import ReactCountryFlag from "react-country-flag";
import { AlertCircle } from "lucide-react";
import { fetchUniversities } from "@/services/universityService";
import { fetchDepartments } from "@/services/departmentService";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    address: "",
    hostelite: false,
    university: "",
    department: "",
    password: "",
    confirmPassword: "",
    cnic: "",
  });
  const [error, setError] = useState("");
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);

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

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(
        "Password must be at least 8 characters long and include at least one uppercase letter, one special character, and one digit."
      );
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: `+92${formData.phone}`,
        password: formData.password,
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        address: formData.address,
        hostelite: formData.hostelite === "true" || formData.hostelite === true,
        university: formData.university,
        department: formData.department,
        cnic: formData.cnic,
        role: "user",
      };

      await signup(userData);
      navigate("/verification-code", { state: { email: formData.email } });
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (error) setError("");
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="min-h-screen py-10 flex items-center justify-center bg-gradient-to-tr from-red-500 via-red-400 to-pink-500">
      <div className="bg-white/10 backdrop-blur-md border border-red-300 rounded-2xl p-8 w-full max-w-2xl shadow-lg mx-4">
        <div className="w-full flex justify-center mb-6">
          <img
            src={logo}
            alt="Donor Hub Logo"
            className="w-32 h-auto drop-shadow-md"
          />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-6">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bloodGroup" className="text-white">Blood Group</Label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-white/20 text-white border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400"
                required
              >
                <option value="" className="text-black">Select Blood Group</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg} className="text-black">{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="phone" className="text-white">Contact Number</Label>
              <div className="mt-1 flex items-center bg-white/20 border border-red-300 rounded-md">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-white/30">
                  <ReactCountryFlag countryCode="PK" svg style={{ width: "20px", height: "20px" }} />
                  <span className="text-white text-sm">+92</span>
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
                  placeholder="3001234567"
                  className="flex-1 bg-transparent text-white border-0 focus:ring-0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-white">City</Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Lahore"
                className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
                required
              />
            </div>
            <div>
              <Label htmlFor="cnic" className="text-white">CNIC (Optional)</Label>
              <Input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="35201-XXXXXXX-X"
                className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hostelite" className="text-white">Residency Status</Label>
            <select
              id="hostelite"
              name="hostelite"
              value={formData.hostelite}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 bg-white/20 text-white border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400"
              required
            >
              <option value={false} className="text-black">Non-Hostelite</option>
              <option value={true} className="text-black">Hostelite</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="university" className="text-white">University (Optional)</Label>
              <select
                id="university"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-white/20 text-white border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400"
              >
                <option value="" className="text-black">Select University</option>
                {universities.map(uni => (
                  <option key={uni._id || uni.name} value={uni.name} className="text-black">{uni.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="department" className="text-white">Department (Optional)</Label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-white/20 text-white border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400"
              >
                <option value="" className="text-black">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id || dept.name} value={dept.name} className="text-black">{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-white">Address (Optional)</Label>
            <Input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Street, Area"
              className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
                required
              />
              <p className="text-xs text-white/70 mt-1">
                8+ chars, 1 uppercase, 1 special, 1 digit
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:ring-red-400"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-400 rounded-lg flex items-center gap-2 text-white">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white mt-6"
          >
            Sign up
          </Button>
        </form>

        <p className="text-center text-white/80 mt-4">
          Have an account?{" "}
          <Link to="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
