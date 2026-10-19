import type { Metadata } from "next";
import { ClientWorkSection } from "@/components/hire/ClientWorkSection";
import { WorkWithMeSection } from "@/components/hire/WorkWithMeSection";

export const metadata: Metadata = {
  title: "Hire Sean David Ramsingh",
  description:
    "Websites from $50, Postiz social scheduler setup from $75, and n8n or Docker setup from $60. Custom builds and monthly care plans. Pay on Ko-fi.",
  openGraph: {
    title: "Hire Sean David Ramsingh",
    description:
      "Small-business websites, custom builds, Postiz setup, and n8n or Docker setup. Monthly care plans available.",
    url: "https://deliberateensemble.works/hire",
  },
};

export default function HirePage() {
  return (
    <div className="p-4 md:p-8 space-y-12 max-w-5xl" data-pagefind-body>
      <WorkWithMeSection heading="h1" />
      <ClientWorkSection />
    </div>
  );
}
