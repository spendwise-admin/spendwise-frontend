import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import { API_BASE } from "../config/api";

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const url = `${API_BASE}/api/${mode}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Store token and login user
      if (data.token && data.user) {
        login(data.user, data.token);
        // User will be redirected to Dashboard automatically
        return;
      }

      setMessage({
        type: "success",
        text:
          data.message ||
          `${
            mode === "signup" ? "Account created" : "Signed in"
          } successfully!`,
      });

      // Clear form
      setEmail("");
      setPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setMessage(null);
    setEmail("");
    setPassword("");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#6b46c1]">
      <div className="w-full max-w-md lg:max-w-4xl bg-gradient-to-b from-[#6f4fc6] to-[#6a43b9] rounded-2xl shadow-xl overflow-hidden lg:flex lg:max-h-[90vh]">
        {/* left image column - visible on large screens */}
        <aside
          className="hidden lg:flex flex-1 bg-gradient-to-b from-[#7c54d6] to-[#6b46c1] p-14 items-center justify-center"
          aria-hidden
        >
          <img
            src="signupImg.jpg"
            alt="Illustration"
            className="w-[420px] max-h-[70vh] h-auto rounded-lg object-cover bg-white/95"
          />
        </aside>

        {/* main form column */}
        <main className="flex-1 p-8 lg:p-12 text-center text-white">
          {/* top image for small screens */}
          <div className="flex lg:hidden mb-4 justify-center">
            <img
              src="signupImg.jpg"
              alt="Illustration"
              className="w-[320px] max-w-[90vw] max-h-[40vh] h-auto rounded-lg object-cover bg-white/95"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">Spend Wise</h1>
          <p className="text-white/90 mt-2">Track. Analyze. Save Smartly.</p>

          <div className="text-sm mt-6 text-white/95">
            {mode === "signin" ? "Welcome back" : "Create your account"}
            <span className="block font-medium mt-2">
              {mode === "signin"
                ? "Sign in to continue"
                : "Sign up to get started"}
            </span>
          </div>

          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              aria-label="email"
              type="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500"
              required
            />
            <input
              aria-label="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-black text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Login"
                : "Sign Up"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === "error"
                  ? "bg-red-500/20 text-red-200 border border-red-500/30"
                  : "bg-green-500/20 text-green-200 border border-green-500/30"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="border-t border-white/30 my-6" />

          <div className="flex flex-col gap-2 text-sm text-white/90">
            <button onClick={toggleMode} className="hover:underline text-left">
              {mode === "signin"
                ? "Don't have your account ? Sign up"
                : "Already have an account? Sign in"}
            </button>
            <a href="#" className="hover:underline">
              Forgot Password ?
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
