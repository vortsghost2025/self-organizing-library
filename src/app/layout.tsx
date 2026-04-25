import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchModal } from "@/components/SearchModal";

export const metadata: Metadata = {
  title: "Deliberate Ensemble - Research Archive",
  description: "Living research archive for human-AI collaboration, multi-agent systems, and constitutional AI governance",
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