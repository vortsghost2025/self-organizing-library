#!/usr/bin/env node
'use strict';

/**
 * Repository Registry Consistency Checker
 *
 * Validates data/repo-registry.json:
 * 1. Valid structure and non-empty repository array
 * 2. Unique repository names
 * 3. NO private repositories exposed in public registry
 * 4. Allowed OWNERSHIP_CLASS values: ORIGINAL_WORK, FORK, MIRROR, EXPERIMENT, ARCHIVE, UNKNOWN
 * 5. Allowed PUBLIC_SITE_CLASS values: FEATURED, LISTED, ARCHIVE_ONLY, EXCLUDE
 * 6. Valid boolean doc_index_allowed
 * 7. Invariant: External forks/mirrors in EXCLUDE must have doc_index_allowed = false
 * 8. Invariant: FEATURED repositories cannot be forks or mirrors
 * 9. Every entry has a valid GitHub URL
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'repo-registry.json');

if (!fs.existsSync(REGISTRY_PATH)) {
  console.error('CRITICAL: data/repo-registry.json not found!');
  process.exit(1);
}

let registry;
try {
  registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
} catch (e) {
  console.error('CRITICAL: Malformed data/repo-registry.json:', e.message);
  process.exit(1);
}

const ALLOWED_OWNERSHIP = new Set(['ORIGINAL_WORK', 'FORK', 'MIRROR', 'EXPERIMENT', 'ARCHIVE', 'UNKNOWN']);
const ALLOWED_PUBLIC_SITE = new Set(['FEATURED', 'LISTED', 'ARCHIVE_ONLY', 'EXCLUDE']);

const errors = [];
const seenNames = new Set();
const repos = registry.repositories || [];

if (!Array.isArray(repos) || repos.length === 0) {
  errors.push('Registry repositories field must be a non-empty array.');
}

for (const repo of repos) {
  // 1. Unique names
  if (!repo.name || typeof repo.name !== 'string') {
    errors.push(`Missing or invalid name for repo entry: ${JSON.stringify(repo)}`);
    continue;
  }
  if (seenNames.has(repo.name)) {
    errors.push(`Duplicate repository name: '${repo.name}'`);
  }
  seenNames.add(repo.name);

  // 2. No private repos
  if (repo.visibility !== 'public') {
    errors.push(`Private repository '${repo.name}' found in public registry! Visibility must be 'public'.`);
  }

  // 3. Allowed ownership class
  if (!ALLOWED_OWNERSHIP.has(repo.ownership_class)) {
    errors.push(`Repo '${repo.name}' has invalid ownership_class '${repo.ownership_class}'.`);
  }

  // 4. Allowed public site class
  if (!ALLOWED_PUBLIC_SITE.has(repo.public_site_class)) {
    errors.push(`Repo '${repo.name}' has invalid public_site_class '${repo.public_site_class}'.`);
  }

  // 5. Boolean doc_index_allowed
  if (typeof repo.doc_index_allowed !== 'boolean') {
    errors.push(`Repo '${repo.name}' doc_index_allowed must be a boolean, found '${repo.doc_index_allowed}'.`);
  }

  // 6. Forks/mirrors cannot be FEATURED
  if (repo.public_site_class === 'FEATURED' && (repo.ownership_class === 'FORK' || repo.ownership_class === 'MIRROR' || repo.fork === true)) {
    errors.push(`Repo '${repo.name}' is marked FEATURED but is a fork or mirror!`);
  }

  // 7. EXCLUDE forks/mirrors cannot be indexed
  if (repo.public_site_class === 'EXCLUDE' && (repo.ownership_class === 'FORK' || repo.ownership_class === 'MIRROR') && repo.doc_index_allowed) {
    errors.push(`External fork/mirror '${repo.name}' is marked EXCLUDE but has doc_index_allowed=true!`);
  }

  // 8. Valid GitHub URL
  if (!repo.github_url || !repo.github_url.startsWith('https://github.com/')) {
    errors.push(`Repo '${repo.name}' missing valid github_url.`);
  }
}

console.log('================================================================================');
console.log('                 REPOSITORY REGISTRY INTEGRITY REPORT');
console.log('================================================================================');
console.log(`Schema Version:       ${registry.schema_version}`);
console.log(`Generated At:         ${registry.generated_at}`);
console.log(`GitHub Owner:         ${registry.github_owner}`);
console.log(`Total Public Repos:   ${repos.length}`);

const featured = repos.filter(r => r.public_site_class === 'FEATURED');
const listed = repos.filter(r => r.public_site_class === 'LISTED');
const archiveOnly = repos.filter(r => r.public_site_class === 'ARCHIVE_ONLY');
const excluded = repos.filter(r => r.public_site_class === 'EXCLUDE');
const docIndexEligible = repos.filter(r => r.doc_index_allowed);

console.log(`  - FEATURED:         ${featured.length}`);
console.log(`  - LISTED:           ${listed.length}`);
console.log(`  - ARCHIVE_ONLY:     ${archiveOnly.length}`);
console.log(`  - EXCLUDE:          ${excluded.length}`);
console.log(`  - DOC_INDEX_ALLOWED:${docIndexEligible.length}`);
console.log('--------------------------------------------------------------------------------');

if (errors.length > 0) {
  console.error('\x1b[31mREGISTRY CHECK FAILED with errors:\x1b[0m');
  for (const err of errors) {
    console.error(`  - \x1b[31m${err}\x1b[0m`);
  }
  console.log('================================================================================');
  process.exit(1);
} else {
  console.log('\x1b[32mREGISTRY CHECK PASSED: All repository metadata rules and invariants satisfied.\x1b[0m');
  console.log('================================================================================');
  process.exit(0);
}
