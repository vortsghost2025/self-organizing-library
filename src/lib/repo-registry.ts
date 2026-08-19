/**
 * Typed Repository Registry Accessor
 * Sourced directly from data/repo-registry.json
 */

import repoRegistryData from "../../data/repo-registry.json";

export type PublicSiteClass = "FEATURED" | "LISTED" | "ARCHIVE_ONLY" | "EXCLUDE";
export type OwnershipClass = "ORIGINAL_WORK" | "FORK_OR_MIRROR";

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
}

export interface RepoRegistry {
  schema_version: string;
  generated_at: string;
  github_owner: string;
  repositories: RepositoryRecord[];
}

const registry: RepoRegistry = repoRegistryData as RepoRegistry;

/**
 * Returns the entire repository registry.
 */
export function getRepoRegistry(): RepoRegistry {
  return registry;
}

/**
 * Returns all public non-excluded repositories (34 repos).
 */
export function getAllPublicRepositories(): RepositoryRecord[] {
  return registry.repositories.filter(
    (r) => r.visibility === "public" && r.public_site_class !== "EXCLUDE"
  );
}

/**
 * Returns the 5 featured portfolio repositories.
 */
export function getFeaturedRepositories(): RepositoryRecord[] {
  return registry.repositories.filter((r) => r.public_site_class === "FEATURED");
}

/**
 * Returns the 5 listed original work repositories.
 */
export function getListedRepositories(): RepositoryRecord[] {
  return registry.repositories.filter((r) => r.public_site_class === "LISTED");
}

/**
 * Returns the 24 archive-only repositories.
 */
export function getArchiveRepositories(): RepositoryRecord[] {
  return registry.repositories.filter((r) => r.public_site_class === "ARCHIVE_ONLY");
}

/**
 * Returns a specific repository by name.
 */
export function getRepositoryByName(name: string): RepositoryRecord | undefined {
  return registry.repositories.find((r) => r.name === name);
}

/**
 * Returns summary counts for public repository tiers.
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
    docIndexAllowed: registry.repositories.filter((r) => r.doc_index_allowed).length,
  };
}
