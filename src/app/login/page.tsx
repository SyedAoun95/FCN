"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function LoginPage() {
  const router = useRouter();

  const handleAdminLogin = () => {
    localStorage.setItem("role", "admin");
    router.push("/dashboard");
  };

  const handleOpLogin = () => {
    localStorage.setItem("role", "op");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleAdminLogin}
            className="w-full px-4 py-3 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
            aria-label="Login as admin"
          >
            Login as Admin
          </button>

          <button
            onClick={handleOpLogin}
            className="w-full px-4 py-3 bg-green-600 rounded-md text-white hover:bg-green-700 transition"
            aria-label="Login as operator"
          >
            Login as Operator
          </button>
        </div>
      </div>
    </div>
  );
}
