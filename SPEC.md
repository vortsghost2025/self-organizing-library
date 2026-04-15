# NexusGraph - Self-Organizing Knowledge Library

## Project Overview

**Project Name:** NexusGraph
**Type:** Full-stack web application (knowledge management system)
**Core Functionality:** A massive, self-organizing library system designed to ingest, index, cross-reference, and visualize thousands of documents with external source integration (GitHub, Medium, DOI, social media). Built for handling 5000+ documents with complex interlinking capabilities.
**Target Users:** Researchers, writers, developers with massive content output who need to organize and reference their work.

---

## UI/UX Specification

### Layout Structure

**App Shell:**
- Left sidebar (280px) - Navigation, source connections, collections
- Main content area - Document viewer/search/graph
- Right panel (collapsible, 320px) - Context/details/links
- Top bar (64px) - Search, quick actions, user

**Page Sections:**
1. **Dashboard** - Overview stats, recent documents, quick links
2. **Library** - Grid/list view of all documents with filters
3. **Graph** - Visual network of document connections
4. **Sources** - External connections (GitHub, Medium, DOI, etc.)
5. **Search** - Full-text search with advanced filters
6. **Collections** - User-defined groupings

**Responsive Breakpoints:**
- Desktop: 1280px+ (full 3-column layout)
- Tablet: 768px-1279px (2-column, collapsible sidebar)
- Mobile: <768px (single column, bottom nav)

### Visual Design

**Color Palette:**
- Background: `#0D0D0F` (deep charcoal)
- Surface: `#16161A` (elevated surface)
- Surface Hover: `#1E1E24`
- Border: `#2A2A32`
- Primary: `#7C3AED` (vivid purple)
- Primary Hover: `#8B5CF6`
- Secondary: `#06B6D4` (cyan accent)
- Text Primary: `#F4F4F5`
- Text Secondary: `#A1A1AA`
- Text Muted: `#71717A`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`

**Typography:**
- Headings: "Outfit" (Google Fonts) - 600/700 weight
- Body: "DM Sans" (Google Fonts) - 400/500 weight
- Mono/Code: "JetBrains Mono" - for document IDs, links
- Sizes: H1: 32px, H2: 24px, H3: 20px, Body: 15px, Small: 13px

**Spacing System:**
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px

**Visual Effects:**
- Card shadows: `0 4px 24px rgba(0,0,0,0.4)`
- Hover transitions: 200ms ease
- Glassmorphism on modals: `backdrop-filter: blur(12px)`
- Subtle gradient on primary buttons: `linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)`

### Components

**Document Card:**
- Title, source icon, word count, date
- Tags (colored pills)
- Connection count indicator
- Hover: elevate + show preview snippet

**Graph Node:**
- Circular, sized by connection count
- Color-coded by source type
- Hover: show document title + preview
- Click: open document detail

**Source Connector Card:**
- Service icon (GitHub, Medium, DOI, Twitter)
- Status indicator (connected/error)
- Last sync time
- Document count

**Search Bar:**
- Command palette style (⌘K trigger)
- Real-time suggestions
- Filter chips (source, date, tags)

**Link/Reference Badge:**
- Small pill showing connected document
- Click to navigate
- Color matches source type

---

## Functionality Specification

### Core Features

#### 1. Document Management
- **Add documents** manually (paste text, upload)
- **Import from URL** (auto-fetch content)
- **Bulk import** (JSON/CSV batch)
- **Document types:** Text, Code, Paper, Link, Note
- **Metadata:** Title, source URL, tags, word count, created/modified dates

#### 2. Cross-Linking System (Rosetta Stone)
- **Bi-directional references** between any documents
- **DOI-style citations** - format: `[[doc-id]]` or `[[doc-id|display text]]`
- **Auto-suggest links** based on content similarity
- **Link graph** - visualize all connections
- **Reference backlinks** - see all docs linking to current

#### 3. External Source Connectors
- **GitHub:** Fetch repos, readmes, issues via API
- **Medium:** Fetch articles via RSS/API
- **DOI:** Fetch paper metadata from CrossRef API
- **Twitter/X:** Fetch tweets (if API available)
- **Custom URLs:** Generic web scraper for any source
- **Sync status:** Last sync, error handling, manual refresh

#### 4. Search & Indexing
- **Full-text search** across all documents
- **Filter by:** Source, tags, date range, connection count
- **AI-readable output** - export in JSONL format for LLM ingestion
- **Vector search** - semantic similarity (using embeddings)
- **Index statistics** - word count, document count, tag count

#### 5. Collections & Organization
- **Create collections** - named groups of documents
- **Auto-collections** - based on tags/sources
- **Starred/pinned** documents
- **Trash** - soft delete with recovery

#### 6. Graph Visualization
- **Force-directed graph** of all documents
- **Cluster by** source type or tags
- **Zoom/pan** controls
- **Click node** to view document
- **Highlight connections** on hover

### User Interactions & Flows

**Adding a Document:**
1. Click "Add Document" → Modal opens
2. Choose input method (paste, URL, file)
3. Fill metadata (title auto-detected, add tags)
4. System analyzes for potential links
5. Save → Document appears in library

**Creating a Link:**
1. Open document → View/edit mode
2. Type `[[` to trigger link picker
3. Search existing docs or create new
4. Select → Link inserted
5. Save → Backlinks auto-update

**Connecting External Source:**
1. Go to Sources page
2. Click "Add Source" → Select type
3. Enter credentials/API key (stored encrypted)
4. Configure what to fetch (repos, articles, etc.)
5. Initial sync → Documents start appearing

**Searching:**
1. Press `⌘K` or click search bar
2. Type query → See real-time results
3. Apply filters (source, tags, date)
4. Click result → Opens document
5. Use arrows to navigate results

### Data Handling

**Database Schema (SQLite via Prisma):**
- Document: id, title, content, type, sourceUrl, wordCount, createdAt, updatedAt
- Tag: id, name, color
- Link: sourceId, targetId, context
- Source: id, type, config (encrypted), lastSync, status
- Collection: id, name, description, isAuto
- DocumentTag: documentId, tagId
- DocumentCollection: documentId, collectionId

**API Endpoints:**
- `GET/POST /api/documents` - List/create documents
- `GET/PUT/DELETE /api/documents/[id]` - CRUD single document
- `POST /api/documents/[id]/links` - Add link to document
- `GET /api/documents/[id]/backlinks` - Get linking docs
- `GET/POST /api/sources` - Manage external sources
- `POST /api/sources/[id]/sync` - Trigger sync
- `GET /api/search` - Full-text search
- `GET /api/graph` - Graph data for visualization
- `GET /api/export` - Export in various formats

### Edge Cases

- **Source unavailable:** Show cached version with "offline" indicator
- **Link to deleted doc:** Show "broken link" indicator, offer to recreate
- **Duplicate detection:** Warn on similar content, offer merge
- **Large documents:** Paginate content, lazy-load
- **Rate limiting:** Queue external fetches, show progress
- **Sync conflicts:** Last-write-wins with conflict log

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme with purple accent consistently applied
- [ ] Sidebar navigation fully functional with icons
- [ ] Document cards display all metadata correctly
- [ ] Graph visualization renders with interactive nodes
- [ ] Search modal opens with ⌘K, shows results live
- [ ] Source connector cards show status indicators
- [ ] Responsive layout works on tablet/mobile

### Functional Checkpoints
- [ ] Can add document manually with all fields
- [ ] Can create bidirectional links between documents
- [ ] Links render as clickable badges in document view
- [ ] Backlinks appear correctly on document detail
- [ ] Can connect GitHub source (mock/simulated)
- [ ] Full-text search returns relevant results
- [ ] Graph shows connected documents as nodes
- [ ] Can create and manage collections
- [ ] Export generates valid JSONL for AI consumption

### Performance Checkpoints
- [ ] Library page loads with 5000 mock documents (virtualized)
- [ ] Search responds in <200ms for typical queries
- [ ] Graph handles 500+ nodes without lag
- [ ] Initial page load <3 seconds