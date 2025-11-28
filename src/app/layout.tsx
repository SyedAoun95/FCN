 import React from "react";
import Link from "next/link";
import "./globals.css";



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">

    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" />
    </head>
      <body style={{ fontFamily: "sans-serif", margin: 0 }}>
        <header style={{ padding: "1rem", background: " #8752f1ff" }}>
           <Link href="/dashboard" style={{color:"black"}}>Home</Link>
           <Link href="/areas" style={{marginLeft: "1rem", color:"black"}}>Areas</Link>   
        </header>
        <main style={{ padding: "0.5rem" }}>{children}


        </main>
      </body>
    </html>
  );
}