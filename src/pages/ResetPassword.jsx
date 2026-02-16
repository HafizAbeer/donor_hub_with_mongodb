import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
    const [formData, setFormData] = useState({
        email: localStorage.getItem("reset_email") || "",
        code: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        return regex.test(password);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!validatePassword(formData.password)) {
            setError("Password must be 8+ chars with uppercase, digit & special char");
            return;
        }

        if (formData.code.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    code: formData.code,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
                localStorage.removeItem("reset_email");
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } else {
                setError(data.message || "Failed to reset password");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-tr from-red-500 via-red-400 to-pink-500">
            <div className="bg-white/10 backdrop-blur-md border border-red-300 rounded-2xl p-8 w-full max-w-md shadow-lg mx-4 sm:mx-6 overflow-y-auto max-h-[90vh]">
                <div className="w-full flex justify-center mt-2">
                    <img
                        src={logo}
                        alt="Donor Hub Logo"
                        className="w-36 h-auto drop-shadow-md"
                    />
                </div>

                <h2 className="text-center text-white text-2xl font-semibold mt-4">
                    Reset Password
                </h2>
                <p className="text-center text-white/80 mt-2 text-sm">
                    Enter the 6-digit code sent to your email and your new password.
                </p>

                {message && (
                    <div className="bg-green-500/20 border border-green-500/50 text-white p-3 rounded-lg mt-4 text-sm flex items-center gap-2 animate-in fade-in zoom-in">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-lg mt-4 text-sm flex items-center gap-2 animate-in fade-in zoom-in">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div>
                        <Label htmlFor="email" className="text-white">
                            Email
                        </Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@mail.com"
                            className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:border-red-400 focus:ring-red-400"
                        />
                    </div>

                    <div>
                        <Label htmlFor="code" className="text-white">
                            Reset Code (6 Digits)
                        </Label>
                        <Input
                            type="text"
                            id="code"
                            name="code"
                            required
                            maxLength={6}
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="123456"
                            className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:border-red-400 focus:ring-red-400"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-white">
                            New Password
                        </Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:border-red-400 focus:ring-red-400"
                        />
                        <p className="text-[10px] text-white/70 mt-1">Requires 8+ chars, 1 uppercase, 1 digit, 1 special char</p>
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword" className="text-white">
                            Confirm New Password
                        </Label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="mt-1 bg-white/20 text-white placeholder-white/70 border-red-300 focus:border-red-400 focus:ring-red-400"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white mt-4 py-6"
                    >
                        {loading ? "Resetting Password..." : "Update Password"}
                    </Button>
                </form>

                <p className="text-center text-white/80 mt-5">
                    Back to{" "}
                    <Link to="/login" className="text-white hover:underline font-medium">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
