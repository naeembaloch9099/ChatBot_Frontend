import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "../Services/Toast";
import { GoogleLogin } from "@react-oauth/google";
import { fetchWithFallback } from "../Services/Api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetchWithFallback("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        localStorage.setItem("isAuthenticated", "1");
        if (data.user && data.user.email)
          localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name || "");
        if (data.user && data.user.picture)
          localStorage.setItem("userPicture", data.user.picture);
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        console.log("[Google Login] success:", data);
        navigate("/chat");
        showToast({
          message: "Logged in with Google",
          type: "success",
          duration: 2000,
        });
      } else {
        console.error("[Google Login] failure:", data);

        // Check if user needs to sign up first
        if (data.needsSignup) {
          showToast({
            message: "Please sign up first",
            type: "error",
            duration: 3000,
          });
        } else {
          showToast({
            message: data.error || "Google login failed",
            type: "error",
          });
        }
      }
    } catch (err) {
      console.error("Google login error:", err);
      showToast({
        message: "Google login failed. Please try again.",
        type: "error",
      });
    }
  };

  const handleGoogleError = () => {
    console.error("Google login error");
    showToast({
      message: "Google login failed",
      type: "error",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWithFallback("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (r) => {
        // Log basic network response info for debugging (status + body)
        console.log("[Login] network response status:", r.status, r.statusText);
        const txt = await r.text().catch(() => "");
        console.log("[Login] network response body:", txt);
        let data = {};
        if (txt) {
          try {
            data = JSON.parse(txt);
          } catch {
            data = { error: txt };
          }
        }
        return { ok: r.ok, status: r.status, ...data };
      })
      .then((data) => {
        if (data && data.ok) {
          localStorage.setItem("isAuthenticated", "1");
          if (data.user && data.user.email)
            localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem(
            "userName",
            (data.user && (data.user.name || data.user.email?.split("@")[0])) ||
              ""
          );
          // Store tokens for cross-origin API calls
          if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
          console.log("[Login] success payload:", data);
          navigate("/chat");
          showToast({ message: "Logged in", type: "success", duration: 2000 });
        } else {
          console.log("[Login] failure payload:", data);
          if (data && data.errorId) {
            console.error(
              `[Login] server error id: ${data.errorId} file: ${data.file} message: ${data.error}`
            );
          }
          showToast({
            message: (data && data.error) || "Login failed",
            type: "error",
          });
        }
      })
      .catch((err) => {
        console.error("Login request failed:", err);
        showToast({
          message: "Network error. Please try again.",
          type: "error",
        });
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">
              Log in to continue to ChatBot
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
              placeholder="Email"
            />
            <input
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
              placeholder="Password"
              type="password"
            />
            <button className="w-full py-3 bg-sky-600 text-white rounded-xl">
              Log in
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-sky-600">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
