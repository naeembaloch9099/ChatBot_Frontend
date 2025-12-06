import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "../Services/Toast";
import { fetchWithFallback } from "../Services/Api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast({ message: "Please enter your email", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithFallback("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        showToast({
          message: "Reset code sent to your email",
          type: "success",
          duration: 3000,
        });
        setStep(2);

        // Show OTP in console for development
        if (data.otp) {
          console.log("[Forgot Password] OTP:", data.otp);
        }
      } else {
        showToast({
          message: data.error || "Failed to send reset code",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      showToast({
        message: err.message || "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp) {
      showToast({ message: "Please enter the OTP", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithFallback("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        showToast({
          message: "OTP verified successfully",
          type: "success",
        });
        setStep(3);
      } else {
        showToast({
          message: data.error || "Invalid OTP",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      showToast({
        message: err.message || "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast({ message: "Please fill all fields", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      showToast({
        message: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithFallback("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        showToast({
          message: "Password reset successfully! Please login.",
          type: "success",
          duration: 3000,
        });
        setTimeout(() => navigate("/"), 2000);
      } else {
        showToast({
          message: data.error || "Failed to reset password",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Reset password error:", err);
      showToast({
        message: err.message || "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔐 Reset Password
          </h1>
          <p className="text-gray-600">
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && "Enter the code sent to your email"}
            {step === 3 && "Create your new password"}
          </p>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="your.email@example.com"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Code sent to: <span className="font-medium">{email}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium disabled:opacity-50"
              >
                Resend Code
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-700 text-sm"
                >
                  ← Change Email
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <FaEyeSlash className="w-5 h-5" />
                  ) : (
                    <FaEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                At least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="w-5 h-5" />
                  ) : (
                    <FaEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && (
              <div className="text-sm">
                {newPassword === confirmPassword ? (
                  <p className="text-green-600 flex items-center">
                    ✓ Passwords match
                  </p>
                ) : (
                  <p className="text-red-600 flex items-center">
                    ✗ Passwords do not match
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              step >= 1 ? "bg-purple-500" : "bg-gray-300"
            }`}
          />
          <div
            className={`w-3 h-3 rounded-full ${
              step >= 2 ? "bg-purple-500" : "bg-gray-300"
            }`}
          />
          <div
            className={`w-3 h-3 rounded-full ${
              step >= 3 ? "bg-purple-500" : "bg-gray-300"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
