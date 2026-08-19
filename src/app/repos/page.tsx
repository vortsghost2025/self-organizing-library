import { getSiteIndex, getCategories, getTopTags } from "@/lib/site-index";
import {
  getFeaturedRepositories,
  getListedRepositories,
  getArchiveRepositories,
  getAllPublicRepositories,
  getRepoCounts,
} from "@/lib/repo-registry";
import { getConstitutionalLaneAuthority } from "@/lib/canonical-governance";
import ReposClient from "./ReposClient";

export default async function ReposPage() {
  const index = getSiteIndex();
  const categories = getCategories();
  const topTags = getTopTags(12);
  const repoCounts = getRepoCounts();

  const featured = getFeaturedRepositories();
  const listed = getListedRepositories();
  const archive = getArchiveRepositories();
  const allPublic = getAllPublicRepositories();
  const laneAuthority = getConstitutionalLaneAuthority();

  const repoFileCounts: Record<string, number> = {};
  for (const [name, stats] of Object.entries(index.stats.by_repo)) {
    repoFileCounts[name] = stats.total_files;
  }

  const laneRepos = [
    {
      id: "library",
      name: "Library",
      repo: "self-organizing-library",
      authority: laneAuthority.library,
      desc: "Verification and proof-of-evidence gatekeeper. Aggregates and validates knowledge artifacts across all lanes.",
      href: "/library",
      graphHref: "/graph?lens=navigation&filterMode=repo&filter=self-organizing-library",
      color: "var(--primary)",
      stat: `${repoFileCounts["self-organizing-library"] || 0} indexed artifacts`,
    },
    {
      id: "archivist",
      name: "Archivist",
      repo: "Archivist-Agent",
      authority: laneAuthority.archivist,
      desc: "Constitutional governance root, proposal ratification, cryptographic policy enforcement, and canonical record.",
      href: "/archivist",
      graphHref: "/graph?lens=authority&filterMode=repo&filter=Archivist-Agent",
      color: "var(--secondary)",
      stat: `${repoFileCounts["Archivist-Agent"] || 0} indexed artifacts`,
    },
    {
      id: "kernel",
      name: "Kernel",
      repo: "kernel-lane",
      authority: laneAuthority.kernel,
      desc: "Runtime enforcement, CUDA/GPU compute acceleration, OS-level policy, and cross-lane message relay routing.",
      href: "/kernel",
      graphHref: "/graph?lens=navigation&filterMode=repo&filter=kernel-lane",
      color: "var(--success)",
      stat: `${repoFileCounts["kernel-lane"] || 0} indexed artifacts`,
    },
    {
      id: "swarmmind",
      name: "SwarmMind",
      repo: "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
      authority: laneAuthority.swarmmind,
      desc: "Multi-agent execution engine, autonomous optimization loops, and drift monitoring oversight.",
      href: "/swarmmind",
      graphHref: "/graph?lens=governance&filterMode=repo&filter=SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
      color: "var(--warning)",
      stat: `${repoFileCounts["SwarmMind-Self-Optimizing-Multi-Agent-AI-System"] || 0} indexed artifacts`,
    },
  ];

  return (
    <ReposClient
      featured={featured}
      listed={listed}
      archive={archive}
      allPublic={allPublic}
      repoCounts={repoCounts}
      repoFileCounts={repoFileCounts}
      laneRepos={laneRepos}
      totalIndexCount={index.entries.length}
      categories={categories}
      topTags={topTags}
    />
  );
}
