"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Apply theme to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.style.backgroundColor = "#1a1a1a";
      html.style.color = "#f5f5f5";
      localStorage.setItem("theme", "dark");
    } else {
      html.style.backgroundColor = "#ffffff";
      html.style.color = "#1a1a1a";
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDark(true);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <button
        onClick={() => setIsDark(!isDark)}
        style={{
          position: "relative",
          width: "70px",
          height: "36px",
          borderRadius: "999px",
          background: isDark ? "linear-gradient(135deg, #4b6cb7, #182848)" : "linear-gradient(135deg, #f6d365, #fda085)",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          transition: "background 0.5s ease",
        }}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            x: isDark ? 34 : 2, // moves the circle
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "16px",
          }}
        >
          {isDark ? "🌙" : "☀️"}
        </motion.div>
      </button>
    </div>
  );
}
