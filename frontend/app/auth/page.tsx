"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { setAuthToken } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const endpoint = isLogin ? "/auth/login" : "/auth/register";

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { email, password, name }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Authentication failed");
        return;
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      localStorage.setItem("ethinos_user_id", data.user.id);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-indigo-600">Ethinos</h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? "Marketing Platform Dashboard" : "Join the Future of Marketing"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "Signing in..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center text-gray-500 text-sm space-y-2">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
          {isLogin && (
            <p className="text-xs text-gray-400">
              Demo: admin@ethinos.com / admin123 or viewer@ethinos.com / viewer123
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
