# Active Context: NexusGraph - Self-Organizing Knowledge Library

## Current State

**Project Status**: ✅ Built and operational

NexusGraph is a comprehensive knowledge management system designed for handling massive document collections (5000+ documents, 45000+ words). It provides cross-referencing, external source integration, and a visual knowledge graph.

## Recently Completed

- [x] NexusGraph application built from scratch
- [x] SQLite database with Drizzle ORM (8 tables: documents, tags, links, sources, collections, documentTags, documentCollections, searchIndex)
- [x] Dark theme UI with purple/cyan accent colors
- [x] Sidebar navigation with document stats
- [x] Library page with document grid and filtering
- [x] Document detail page with forward links and backlinks
- [x] Knowledge graph visualization (canvas-based force-directed)
- [x] Sources page for external connectors (GitHub, Medium, DOI, Twitter)
- [x] Collections page for organizing documents
- [x] Command palette search (⌘K) with real-time results
- [x] API routes for search functionality
- [x] Mock data fallbacks for demo mode

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/lib/db.ts` | Database operations with mock fallbacks | ✅ |
| `src/components/Sidebar.tsx` | Navigation sidebar | ✅ |
| `src/components/SearchModal.tsx` | Command palette search | ✅ |
| `src/app/page.tsx` | Dashboard with stats | ✅ |
| `src/app/library/page.tsx` | Document library grid | ✅ |
| `src/app/library/[id]/page.tsx` | Document detail with links | ✅ |
| `src/app/graph/page.tsx` | Visual knowledge graph | ✅ |
| `src/app/sources/page.tsx` | External source connectors | ✅ |
| `src/app/collections/page.tsx` | Document collections | ✅ |
| `src/app/api/search/route.ts` | Search API | ✅ |
| `src/db/schema.ts` | Database schema | ✅ |

## Features Implemented

### Core Features
- Document management (add, view, organize)
- Cross-linking system with `[[doc-id]]` references
- Bi-directional links (forward links + backlinks)
- Full-text search with ⌘K command palette
- Collections (manual + auto-generated)

### External Sources (UI Ready)
- GitHub repositories
- Medium articles
- DOI papers
- Twitter/X
- Custom URLs

### Visual Features
- Force-directed graph visualization
- Document type color coding
- Connection count indicators
- Dark theme with glassmorphism

### Data Model
- Documents: 5000 capacity, word counts, metadata
- Tags: colored categories
- Links: cross-references with context
- Sources: external platform connections
- Collections: grouped documents

## Current Focus

The app is complete and builds successfully. To extend:
1. Connect real database by setting DB_URL/DB_TOKEN env vars
2. Add API routes for creating/editing documents
3. Implement actual external source sync (GitHub API, Medium RSS, CrossRef)
4. Add vector search for semantic similarity
5. Export functionality for AI consumption (JSONL)

## Session History

| Date | Changes |
|------|---------|
| Initial | Base Next.js template created |
| Today | Built NexusGraph - full knowledge library app |

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS 4
- Drizzle ORM + SQLite
- Bun package manager