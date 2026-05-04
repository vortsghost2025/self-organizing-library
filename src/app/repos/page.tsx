import { getSiteIndex, getCategories, getTopTags } from "@/lib/site-index";
import ReposClient from "./ReposClient";

export default async function ReposPage() {
  const index = getSiteIndex();
  const categories = getCategories();
  const topTags = getTopTags(12);

  const repoGroups: Record<string, { count: number; categories: Record<string, number> }> = {};
  for (const entry of index.entries) {
    if (!repoGroups[entry.repo]) {
      repoGroups[entry.repo] = { count: 0, categories: {} };
    }
    repoGroups[entry.repo].count++;
    repoGroups[entry.repo].categories[entry.category] = (repoGroups[entry.repo].categories[entry.category] || 0) + 1;
  }

  const laneRepos = [
    {
      name: "Library",
      desc: "Documentation, verification, and coordination hub — the central archive for all governance artifacts",
      href: "/library",
      color: "var(--primary)",
      stat: `${repoGroups["self-organizing-library"]?.count || 0} files`
    },
    {
      name: "Archivist",
      desc: "Governance, sovereignty, and identity enforcement — maintains the truth ledger and ratification protocol",
      href: "/archivist",
      color: "var(--secondary)",
      stat: `${repoGroups["Archivist-Agent"]?.count || 0} files`
    },
    {
      name: "Kernel",
      desc: "Runtime enforcement, constraint lattice, OS-level policies — the operational control plane",
      href: "/kernel",
      color: "var(--success)",
      stat: `${repoGroups["kernel-lane"]?.count || 0} files`
    },
    {
      name: "SwarmMind",
      desc: "Multi-agent drift detection and constraint verification — autonomous oversight and validation",
      href: "/swarmmind",
      color: "var(--warning)",
      stat: `${repoGroups["SwarmMind"]?.count || 0} files`
    },
  ];

  return (
    <ReposClient
      repoGroups={repoGroups}
      laneRepos={laneRepos}
      index={index}
      categories={categories}
      topTags={topTags}
    />
  );
}
