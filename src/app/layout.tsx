import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchModal } from "@/components/SearchModal";

export const metadata: Metadata = {
  title: "NexusGraph - Self-Organizing Knowledge Library",
  description: "A massive, self-organizing library for your documents, papers, and ideas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[280px] min-h-screen">
            {children}
          </main>
        </div>
        <SearchModal />
      </body>
    </html>
  );
}