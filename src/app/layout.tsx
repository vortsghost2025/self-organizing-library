import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchModal } from "@/components/SearchModal";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { getStats } from "@/lib/site-index";

export const metadata: Metadata = {
  title: "Deliberate Ensemble - Research Archive",
  description: "Living research archive for human-AI collaboration, multi-agent systems, and constitutional AI governance",
  openGraph: {
    title: "Deliberate Ensemble - Research Archive",
    description: "Living research archive for human-AI collaboration, multi-agent systems, and constitutional AI governance",
    url: "https://deliberateensemble.works",
    siteName: "Deliberate Ensemble",
    images: [
      {
        url: "/sigularity2.jpg",
        width: 1200,
        height: 630,
        alt: "Deliberate Ensemble - human-AI partnership",
      },
      {
        url: "/ss.jpg",
        width: 1200,
        height: 630,
        alt: "Deliberate Ensemble - research archive",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deliberate Ensemble - Research Archive",
    description: "Living research archive for human-AI collaboration, multi-agent systems, and constitutional AI governance",
    images: ["/sigularity2.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = getStats();
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
    <body className="min-h-screen">
    <AccessibilityProvider>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div className="flex min-h-screen">
        <Sidebar stats={stats} />
        <main id="main-content" className="flex-1 ml-0 md:ml-[280px] min-h-screen" role="main">
          {children}
        </main>
      </div>
      <SearchModal />
    </AccessibilityProvider>
    </body>
    </html>
  );
}
