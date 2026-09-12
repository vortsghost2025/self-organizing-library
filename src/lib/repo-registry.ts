/**
 * Typed Repository Registry Accessor
 * Sourced directly from data/repo-registry.json
 */

import repoRegistryData from "../../data/repo-registry.json";

export type PublicSiteClass = "FEATURED" | "LISTED" | "ARCHIVE_ONLY" | "EXCLUDE";
export type OwnershipClass = "ORIGINAL_WORK" | "FORK_OR_MIRROR" | "FORK" | "MIRROR" | "EXPERIMENT" | "ARCHIVE" | "UNKNOWN";
export type DomainCategory =
  | "safety_governance"
  | "terminals_workspace"
  | "swarm_consensus"
  | "simulation_research"
  | "public_health";

export interface RepositoryRecord {
  name: string;
  github_url: string;
  visibility: "public" | "private";
  ownership_class: OwnershipClass;
  public_site_class: PublicSiteClass;
  doc_index_allowed: boolean;
  archived: boolean;
  fork: boolean;
  parent_repo: string | null;
  description: string;
  system_role: string;
  portfolio_summary: string;
  local_path: string | null;
  source_of_truth: string;
  domain_category?: DomainCategory;
  tech_tags?: string[];
}

export interface RepoRegistry {
  schema_version: string;
  generated_at: string;
  github_owner: string;
  repositories: RepositoryRecord[];
}

const registry: RepoRegistry = repoRegistryData as unknown as RepoRegistry;

/**
 * Returns the entire repository registry.
 */
export function getRepoRegistry(): RepoRegistry {
  return registry;
}

/**
 * Returns all public non-excluded repositories.
 */
export function getAllPublicRepositories(): RepositoryRecord[] {
  return registry.repositories.filter(
    (r) => r.visibility === "public" && r.public_site_class !== "EXCLUDE"
  );
}

/**
 * Returns the featured portfolio repositories.
 */
export function getFeaturedRepositories(): RepositoryRecord[] {
  return registry.repositories.filter((r) => r.public_site_class === "FEATURED");
}

/**
 * Returns the listed original work and extension repositories.
 */
export function getListedRepositories(): RepositoryRecord[] {
  return registry.repositories.filter((r) => r.public_site_class === "LISTED");
}

/**
 * Returns the archive-only repositories.
 */
export function getArchiveRepositories(): RepositoryRecord[] {
  return registry.repositories.filter((r) => r.public_site_class === "ARCHIVE_ONLY");
}

/**
 * Returns all active showcase repositories (FEATURED + LISTED).
 */
export function getShowcaseRepositories(): RepositoryRecord[] {
  return registry.repositories.filter(
    (r) => r.visibility === "public" && (r.public_site_class === "FEATURED" || r.public_site_class === "LISTED")
  );
}

/**
 * Returns repositories belonging to a specific domain category.
 */
export function getRepositoriesByDomain(domain: DomainCategory): RepositoryRecord[] {
  return registry.repositories.filter(
    (r) => r.visibility === "public" && r.public_site_class !== "EXCLUDE" && r.domain_category === domain
  );
}

/**
 * Returns a specific repository by name.
 */
export function getRepositoryByName(name: string): RepositoryRecord | undefined {
  return registry.repositories.find((r) => r.name === name);
}

/**
 * Returns summary counts for public repository tiers and domains.
 */
export function getRepoCounts() {
  const featured = getFeaturedRepositories();
  const listed = getListedRepositories();
  const archive = getArchiveRepositories();
  const allPublic = registry.repositories.filter((r) => r.visibility === "public");
  return {
    totalPublic: allPublic.length,
    featured: featured.length,
    listed: listed.length,
    archive: archive.length,
    showcase: featured.length + listed.length,
    docIndexAllowed: registry.repositories.filter((r) => r.doc_index_allowed).length,
    domains: {
      safety_governance: registry.repositories.filter((r) => r.domain_category === "safety_governance").length,
      terminals_workspace: registry.repositories.filter((r) => r.domain_category === "terminals_workspace").length,
      swarm_consensus: registry.repositories.filter((r) => r.domain_category === "swarm_consensus").length,
      simulation_research: registry.repositories.filter((r) => r.domain_category === "simulation_research").length,
      public_health: registry.repositories.filter((r) => r.domain_category === "public_health").length,
    },
  };
}

