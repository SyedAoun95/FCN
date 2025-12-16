"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username.trim() || !password.trim()) {
      alert("Please enter username and password");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/couchdb-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-12 border">
        <h2 className="text-4xl font-bold text-center mb-3">
          Admin Login
        </h2>

        <p className="text-center text-gray-500 mb-10">
          Sign in to access the admin dashboard
        </p>

        <input
          className="w-full mb-6 px-6 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500"
          placeholder="Admin Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-8 px-6 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
