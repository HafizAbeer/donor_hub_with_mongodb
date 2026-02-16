import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

import logo from "@/assets/logo.png";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      console.log("Login Error:", err);
      console.log("Error Data:", err.data);
      if (err.data && err.data.isVerified === false) {
        // Redirect to verification page with email
        navigate("/verification-code", { state: { email: err.data.email || formData.email } });
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-tr from-red-500 via-red-400 to-pink-500">
      <div className="bg-white/10 backdrop-blur-md border border-red-300 rounded-2xl p-8 w-full max-w-md shadow-lg mx-4 sm:mx-6">
        <div className="w-full flex justify-center mt-5">
          <img
            src={logo}
            alt="Donor Hub Logo"
            className="w-44 h-auto drop-shadow-md"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@mail.com"
              className="mt-2 bg-white/20 text-white placeholder-white/70 border-red-300 focus:border-red-400 focus:ring-red-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              className="mt-2 bg-white/20 text-white placeholder-white/70 border-red-300 focus:border-red-400 focus:ring-red-400"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-400 rounded-lg flex items-center gap-2 text-red-100">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
          >
            Login
          </Button>
        </form>



        <p className="text-center text-white/80 mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-center text-white/80 mt-4">
          <Link to="/forgot-password" className="text-white hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
