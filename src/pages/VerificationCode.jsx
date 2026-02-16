import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendCode } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputs = useRef([]);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect to login or signup
      navigate("/login");
    }
  }, [location, navigate]);

  const handleChange = (e, index) => {
    const value = e.target.value;

    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Allow only one digit
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5 && inputs.current[index + 1]) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputs.current[index - 1]) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text");
    if (!/^\d{6}$/.test(data)) return;

    const newOtp = data.split("");
    setOtp(newOtp);
    inputs.current[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await verifyEmail(email, code);
      setMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Verification failed");
      setIsLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await resendCode(email);
      setMessage("Verification code resent to your email.");
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
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

        <h2 className="text-center text-white text-2xl font-semibold mt-6">
          Enter Verification Code
        </h2>

        <p className="text-center text-white/80 mt-2 text-sm">
          Enter the 6-digit code sent to <strong>{email}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-between mt-8 px-2 gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                maxLength={1}
                value={data}
                className="w-10 h-12 sm:w-12 sm:h-12 text-center text-xl bg-white/20 text-white border border-red-300 rounded-lg focus:ring-red-400 focus:border-red-400 outline-none"
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400 rounded-lg flex items-center gap-2 text-white">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {message && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-400 rounded-lg flex items-center gap-2 text-white">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white mt-8 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
        </form>

        <p className="text-center text-white/80 mt-5">
          Didn't receive the code?{" "}
          <button onClick={handleResend} type="button" className="text-white hover:underline bg-transparent border-0 cursor-pointer">
            Resend
          </button>
        </p>

        <p className="text-center text-white/80 mt-2">
          Change email?{" "}
          <Link to="/signup" className="text-white hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
