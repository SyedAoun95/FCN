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
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      gap: "20px" 
    }}>
      <h1>Login</h1>

      <button 
        onClick={handleAdminLogin} 
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        Login as Admin
      </button>

      <button 
        onClick={handleOpLogin}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        Login as Operator
      </button>
    </div>
  );
}
