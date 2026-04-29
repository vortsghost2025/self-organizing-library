"use client";

import Link from "next/link";

const steps = [
  {
    id: 1,
    title: "Browse the Library",
    description: "Explore our living research archive containing all indexed documents from the project. Search by title, tag, or category.",
    link: "/library",
    icon: "📚"
  },
  {
    id: 2,
    title: "Read the Papers",
    description: "The Rosetta Stone series (Papers 1–6) forms the theoretical backbone. Start with Paper 1 for the foundational concepts, then progress through the series.",
    link: "/papers",
    icon: "📄"
  },
  {
    id: 3,
    title: "Explore the Nexus Graph",
    description: "The interactive graph shows connections between documents based on shared tags and cross-references. Filter by content type to focus on what matters.",
    link: "/graph",
    icon: "🔗"
  },
  {
    id: 4,
    title: "Browse Repos",
    description: "Each repository in the organization is indexed. See what documents exist in each repo and navigate directly to GitHub.",
    link: "/repos",
    icon: "📁"
  },
  {
    id: 5,
    title: "Use Search",
    description: "Press ⌘K or Ctrl+K to open search. Search across all documents by title, path, description, or tags.",
    link: "#",
    icon: "🔍"
  }
];

export function GuidedWalkthrough() {
  return (
    <div className="space-y-6 mb-12">
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Guided Walkthrough</h2>
      
      <div className="grid gap-6">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="card p-6 animate-fade-in"
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl flex-shrink-0" aria-hidden="true">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">{step.title}</h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  {step.description}
                </p>
                {step.link !== "#" && (
                  <Link 
                    href={step.link} 
                    className="text-[var(--primary)] hover:underline text-sm inline-flex items-center"
                  >
                    {step.link !== "#" ? "Go to " + step.title : "Learn more"} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}