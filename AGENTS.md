# NexusGraph Agent Instructions

## Project Overview

NexusGraph is a self-organizing knowledge library system built with:
- **Next.js 16** with App Router
- **Drizzle ORM** with SQLite
- **Tailwind CSS 4**
- **TypeScript 5.9**

## Code Style

- Use TypeScript strict mode
- Follow the established color theme (see `src/app/globals.css`)
- Use `var(--*)` for colors in CSS
- Server Components by default, Client Components only when needed
- Use `async/await` for async operations

## Database

- SQLite with Drizzle ORM
- Schema located at `src/db/schema.ts`
- Run migrations with `bun run db:migrate`
- Generate migrations with `bun run db:generate`

## File Structure

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

## Key Features to Implement

1. Document management (CRUD)
2. Cross-linking system (Rosetta Stone)
3. External source connectors (GitHub, Medium, DOI)
4. Full-text search
5. Graph visualization
6. Collections organization

## Important Files

- `SPEC.md` - Full project specification
- `AGENTS.md` - Agent instructions (this file)
- `src/db/schema.ts` - Database schema

## Notes

- This project is merged with a self-organizing library project
- Book outlines and analysis are in the `books/` and `analysis/` directories
- SwarmMind project is in `SwarmMind-Self-Optimizing-Multi-Agent-AI-System/`
