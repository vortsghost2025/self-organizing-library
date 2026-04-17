# NexusGraph - Self-Organizing Knowledge Library

A massive, self-organizing library system for ingesting, indexing, cross-referencing, and visualizing thousands of documents with external source integration.

## Tech Stack

- **Next.js 16** with App Router
- **Drizzle ORM** with SQLite
- **Tailwind CSS 4**
- **TypeScript 5.9**

## Getting Started

```bash
# Install dependencies
bun install

# Generate database migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Start development server
bun run dev
```

## Features

- 📚 Document management (CRUD)
- 🔗 Cross-linking system (Rosetta Stone)
- 🔌 External source connectors (GitHub, Medium, DOI)
- 🔍 Full-text search
- 📊 Graph visualization
- 📁 Collections organization

## Database Schema

7 tables power the system:
- `documents` - Main document store
- `tags` / `document_tags` - Tagging system
- `links` - Bi-directional document connections
- `sources` - External source connectors
- `collections` / `document_collections` - User groupings
- `search_index` - Full-text search with embeddings

## Project Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── api/       # API routes
│   ├── library/   # Library page
│   ├── graph/     # Graph visualization (TODO)
│   ├── sources/   # External sources (TODO)
│   └── collections/ # Collections (TODO)
├── components/    # Reusable React components
├── db/           # Database schema and utilities
└── lib/          # Helper functions
```

## Library Content

This repo also contains:
- `books/` - Book outlines and assembled content (5 books, ~3,500 words assembled)
- `analysis/` - Project analysis reports (content hash, timeline, security audit)
- `SwarmMind-Self-Optimizing-Multi-Agent-AI-System/` - Multi-agent AI hackathon project

## Color Theme

See `src/app/globals.css` for the full color palette:
- Background: `#0D0D0F` (deep charcoal)
- Primary: `#7C3AED` (vivid purple)
- Secondary: `#06B6D4` (cyan accent)

## License

AGPL-3.0
