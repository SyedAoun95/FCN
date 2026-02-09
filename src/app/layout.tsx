// app/layout.tsx
import "./globals.css";
import ClientLayoutWrapper from "./components/ClientLayoutWrapper";
import DarkModeToggle from "../app/components/DarkModeToggle";

export const metadata = {
  title: "FCN || the brand",
  description: "Sidebar everywhere",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
