import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchModal } from "@/components/SearchModal";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { getStats } from "@/lib/site-index";

const siteTitle = "Sean David Ramsingh — Websites, Automation & AI Research";
const siteDescription =
  "Sean David Ramsingh builds small-business websites, custom tools, Postiz setups, and n8n or Docker automation. This site is also the Deliberate Ensemble research archive.";

export const metadata: Metadata = {
  metadataBase: new URL("https://deliberateensemble.works"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
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
    title: siteTitle,
    description: siteDescription,
    images: ["/sigularity2.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = getStats();
  return (
    <html lang="en">
    <body className="min-h-screen overflow-x-clip">
    <SiteJsonLd />
    <AccessibilityProvider>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div className="flex min-h-screen min-w-0 max-w-full">
        <Sidebar stats={stats} />
        <main id="main-content" className="flex-1 ml-0 md:ml-[280px] min-h-screen min-w-0 max-w-full overflow-x-clip pb-8 md:pb-20" role="main">
          {children}
        </main>
      </div>
      <SearchModal />
    </AccessibilityProvider>
    </body>
    </html>
  );
}
