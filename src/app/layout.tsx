// app/layout.tsx
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "FCN || the  brand ",
  description: "Sidebar everywhere",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex">

        {/* Sidebar visible on all pages */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 min-h-screen bg-gray-50 p-6">
          {children}
        </main>

      </body>
    </html>
  );
}
