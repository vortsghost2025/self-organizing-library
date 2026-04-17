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

## Project Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── api/       # API routes
│   ├── library/   # Library page
│   ├── graph/     # Graph visualization
│   ├── sources/   # External sources
│   └── collections/ # Collections
├── components/    # Reusable React components
├── db/           # Database schema and utilities
└── lib/          # Helper functions
```

## Library Content

This repo also contains:
- `books/` - Book outlines and assembled content
- `analysis/` - Project analysis reports
- `SwarmMind-Self-Optimizing-Multi-Agent-AI-System/` - Multi-agent AI project

## License

AGPL-3.0
