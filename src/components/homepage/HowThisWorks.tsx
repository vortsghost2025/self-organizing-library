"use client";

import { useState } from "react";
import Link from "next/link";

const steps = [
  {
    id: "theory",
    title: "Step 1: The Theory",
    description: "The WE4FREE papers form the theoretical foundation of the system. These documents explain the core concepts of human-AI collaboration, constraint lattices, and multi-agent governance.",
    link: "/papers",
    color: "#7C3AED",
    icon: "🧠"
  },
  {
    id: "simulation",
    title: "Step 2: The Simulation",
    description: "Federation serves as a pre-lane governance simulation, testing concepts in a controlled environment before implementation in the live system.",
    link: "/repos/federation",
    color: "#06B6D4",
    icon: "🌐"
  },
  {
    id: "lanes",
    title: "Step 3: The 4 Lanes",
    description: "The system is organized into 4 autonomous lanes, each with distinct authority and duties: Archivist (governance), Library (verification), SwarmMind (execution), and Kernel (runtime).",
    link: "/lanes",
    color: "#10B981",
    icon: "◈"
  },
  {
    id: "graph",
    title: "Step 4: The Nexus Graph",
    description: "The Nexus Graph visualizes connections between documents and system components. Nodes represent artifacts, edges represent relationships, and colors represent repos/domains.",
    link: "/graph",
    color: "#F59E0B",
    icon: "◇"
  },
  {
    id: "evidence",
    title: "Step 5: Evidence and Contradictions",
    description: "Contradictions are not hidden. They are mapped, reviewed, and either resolved, rejected, or quarantined as part of the system's truth routing process.",
    link: "/docs/graph/NEXUS_GRAPH_CONTRADICTION_LAYER",
    color: "#EF4444",
    icon: "⚠"
  },
  {
    id: "current",
    title: "Step 6: Current Work",
    description: "The system continuously evolves with new features, services, and improvements based on ongoing research and development.",
    link: "/governance",
    color: "#8B5CF6",
    icon: "⚡"
  }
];

export function HowThisWorks() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const expandAll = () => {
    if (expanded) {
      setExpanded(null);
    } else {
      // Expand the first step by default
      setExpanded(steps[0].id);
    }
  };

  return (
    <section className="card p-6 mb-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          How This Works
        </h2>
        <button
          onClick={expandAll}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] px-3 py-1 rounded"
          aria-label={expanded ? "Collapse all steps" : "Expand first step"}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      
      <div className="space-y-4">
        {steps.map((step) => {
          const isOpen = expanded === step.id;
          return (
            <div
              key={step.id}
              className="border border-[var(--border)] rounded-lg overflow-hidden transition-all"
              style={isOpen ? { borderColor: step.color } : undefined}
            >
              <button
                onClick={() => toggle(step.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] rounded-lg"
                aria-expanded={isOpen}
                aria-controls={`step-content-${step.id}`}
              >
                <span
                  className="text-xl flex-shrink-0"
                  style={{ color: step.color }}
                  aria-hidden="true"
                >
                  {step.icon}
                </span>
                <span className="font-medium text-[var(--text-primary)] text-lg flex-1 text-left">
                  {step.title}
                </span>
                <span
                  className="text-[var(--text-muted)] text-sm transition-transform duration-200 flex-shrink-0"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                >
                  ▶
                </span>
              </button>
              
              {isOpen && (
                <div
                  id={`step-content-${step.id}`}
                  className="px-4 pb-4 pt-0 animate-fade-in"
                  role="region"
                  aria-label={`${step.title} details`}
                >
                  <div
                    className="text-[var(--text-secondary)] leading-relaxed"
                    style={{ borderLeft: `3px solid ${step.color}44`, paddingLeft: "12px" }}
                  >
                    <p className="mb-4">{step.description}</p>
                    <Link 
                      href={step.link} 
                      className="text-sm inline-flex items-center"
                      style={{ color: step.color }}
                    >
                      Learn more →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}