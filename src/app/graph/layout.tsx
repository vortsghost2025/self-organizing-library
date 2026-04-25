import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexus Graph | Deliberate Ensemble",
  description:
    "Interactive map of document connections across the Deliberate Ensemble research archive",
};

export default function GraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
