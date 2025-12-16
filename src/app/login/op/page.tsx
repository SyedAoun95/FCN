"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OpLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await fetch("/api/couchdb-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-12 border">
        <h2 className="text-4xl font-bold text-center mb-3">
          Operator Login
        </h2>

        <p className="text-center text-gray-500 mb-10">
          Enter your operator credentials
        </p>

        <input
          className="w-full mb-6 px-6 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-green-500"
          placeholder="Operator Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-8 px-6 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-green-500"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
