// src/app/login/op/page.tsx

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
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
      <h2 className="text-2xl font-bold mb-6">Operator Login</h2>

      <input
        className="mb-4 px-4 py-2 border rounded-lg w-64"
        placeholder="Operator Username"
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        className="mb-4 px-4 py-2 border rounded-lg w-64"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={login}
        className="px-5 py-2 bg-green-600 text-white rounded-lg"
      >
        Login
      </button>
    </div>
  );
}
