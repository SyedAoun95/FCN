import React from 'react';
import './globals.css';
import Link from "next/link";
export default function Home() {
  return (
    <h1 className="text-3xl font-bold underline text-center cursor-pointer">
         <Link href="/dashboard" style={{color:"white"}}>Go to dashboard</Link>
    </h1>
  )
}
  
