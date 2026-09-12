# Deliberate Ensemble Library - Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment with automatic preview and production deployments.

**Deploy to production:**
```bash
npm run deploy:prod
```

**Deploy preview:**
```bash
npm run deploy:preview
```

### Environment Variables Required

- `VERCEL_TOKEN` - Your Vercel authentication token
- `NEXT_PUBLIC_SITE_URL` - Public URL of your deployed site
- `NVIDIA_API_KEY` - NVIDIA API access
- `OPENROUTER_API_KEY` - OpenRouter API access
- `HOSTINGER_API_KEY` - Hostinger API access
- `LITELLM_MASTER_KEY` - LiteLLM master key

## Development Workflow

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint linting
npm run test             # Run tests

# Governance & Lanes
npm run watch            # Watch lane inboxes
npm run worker           # Start lane worker
npm run heartbeat        # System health check

# Database
npm run db:generate      # Generate database migrations
npm run db:migrate       # Run database migrations
```

## Project Structure

```
├── .agents/              # Devin agent skills
│   └── skills/          # Project-specific skills
├── .devin/              # Devin configuration
├── .global/             # Global governance rules
├── app/                 # Next.js app directory
├── lanes/               # 4-lane governance system
│   ├── library/         # Verification lane
│   ├── archivist/       # Archival lane
│   ├── swarmmind/       # Proposal lane
│   └── kernel/          # Infrastructure lane
├── src/                 # Source code
│   ├── components/      # React components
│   └── lib/            # Utilities and libraries
└── evidence/            # Verification evidence
```

## The 4-Lane Governance System

This project implements a multi-agent governance system with 4 lanes:

1. **Library** - Verification gatekeeper
2. **Archivist** - Final authority and archival
3. **SwarmMind** - Idea generation and proposals
4. **Kernel** - Infrastructure and coordination

### OUTPUT_PROVENANCE Requirement

All messages, reports, and artifacts must include:
```
OUTPUT_PROVENANCE:
agent: <runtime>
lane: <your-lane>
target: <task>
generated_at: <ISO-8601>
session_id: <session>
```

## MCP Servers Configured

- **devin/memory** - Knowledge graph memory
- **morph-mcp** - Advanced code editing and search
- **sequential-thinking** - Complex reasoning

## Skills Available

- `library-governance` - Lane sovereignty and message protocols
- `nexus-graph` - Graph visualization system
- `next-best-practices` - Next.js optimization
- `verification-before-completion` - Pre-completion checks
- `systematic-debugging` - Debugging methodology

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Type Errors
```bash
# Run typecheck to see specific errors
npm run typecheck
```

### Lane Worker Issues
```bash
# Check lane status
npm run heartbeat:check

# Reset worker
npm run worker:stop
npm run worker
```

## Hostinger Integration

The site is deployed on Hostinger through Vercel. Ensure your:

1. DNS records point to Vercel
2. SSL certificates are configured
3. Environment variables are set in both Vercel and Hostinger

## Additional Resources

- [AGENTS.md](./AGENTS.md) - Agent orientation guide
- [GOVERNANCE.md](./GOVERNANCE.md) - Full governance protocol
- [README.md](./README.md) - Project overview
