"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OperatorLoginPage() {
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
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 w-full max-w-md">
        
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Login as Operator
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Enter operator login details
        </p>

        <input
          className="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-green-500 focus:border-transparent 
                     text-gray-800 placeholder-gray-500"
          placeholder="Operator Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-6 px-4 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-green-500 focus:border-transparent 
                     text-gray-800 placeholder-gray-500"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 
                     text-white rounded-lg font-medium transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          onClick={() => alert("Signup system coming soon")}
          className="w-full mt-4 px-6 py-3 bg-gray-100 text-gray-700 
                     hover:bg-gray-200 rounded-lg transition"
        >
          Signup Instead
        </button>

      </div>
    </div>
  );
}
