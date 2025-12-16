"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { initDB } from "../services/db";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'op'>('admin');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const db = await initDB();
      if (!db) throw new Error("DB not available");

      if (mode === 'signup') {
        await db.createUser(username, password, role);
        setSuccess('User created successfully! Please login.');
        setMode('login');
      } else if (mode === 'login') {
        const user = await db.getUser(username, password);
        if (user) {
          localStorage.setItem("role", user.role);
          localStorage.setItem("username", user.username);
          router.push("/dashboard");
        } else {
          setError('Invalid username or password');
        }
      } else if (mode === 'forgot') {
        // For demo, show all users (not secure)
        const users = await db.getAllUsers();
        const user = users.find((u: any) => u.username === username.toLowerCase());
        if (user) {
          setSuccess(`Password hint: ${atob(user.password).slice(0, 2)}**`);
        } else {
          setError('User not found');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white px-4">
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Forgot Password'}
        </h1>
        <p className="text-gray-400 text-center mb-6">
          {mode === 'login' ? 'Welcome back!' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition"
              placeholder="Enter username"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition"
                placeholder="Enter password"
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'op')}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition"
              >
                <option value="admin">Admin</option>
                <option value="op">Operator</option>
              </select>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg hover:from-blue-700 hover:to-purple-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('signup')} className="text-blue-400 hover:text-blue-300 text-sm transition">
                Don't have an account? Sign up
              </button>
              <br />
              <button onClick={() => setMode('forgot')} className="text-gray-400 hover:text-gray-300 text-sm transition">
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 text-sm transition">
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
