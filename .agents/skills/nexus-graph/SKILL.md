---
name: nexus-graph
description: Works with the Nexus Graph visualization system including graph data, clusters, snapshots, and the React Sigma-based graph viewer
trigger_when:
  - Working with the Nexus Graph viewer at /graph
  - Manipulating graph data structures or types
  - Computing clusters or entry points
  - Saving/loading graph snapshots
  - Working with graphology library or @react-sigma/core
do_not_trigger_when:
  - General React component work unrelated to graph visualization
  - Simple data structures without graph context
version: "1.1"
author: Library System
tags: [graph, visualization, sigma, react, data-structures]
---

# Nexus Graph Skill

This skill helps agents work with the Nexus Graph visualization system used in the Deliberate Ensemble Library.

## AUTHORITY — READ FIRST

Before any Nexus Graph work, read `docs/graph/GRAPH_RESTORE_SPEC_V1.md`.

That spec is the design authority. The graph is a thinking instrument, not a data dump.

**Current standing order:** inspect and plan only. Do not change graph components, layout, filters, layers, visual semantics, or graph-data generation until a restoration plan is explicitly approved.

Preserve current implementation and screenshots before any later restore. Restoration must target presentation and exploration behavior first, not the underlying knowledge model.

If this skill's workflow notes conflict with the spec, the spec wins. Record the conflict; do not "fix" it by changing code during inspection.

## Core Technologies

- **graphology**: Graph data structure library
- **@react-sigma/core**: React wrapper for Sigma.js
- **sigma**: WebGL-accelerated graph rendering
- **graphology-layout-forceatlas2**: Force-directed layout algorithm

## Key File Locations

- Design authority: `docs/graph/GRAPH_RESTORE_SPEC_V1.md` — read first; code frozen until inspect/plan approved
- Graph types: `src/lib/graph-types.ts` - TypeScript types + color constants
- Clusters: `src/lib/graph-clusters.ts` - Cluster & entry point computation
- Snapshots: `src/lib/graph-snapshot.ts` - Save/load/compare graph states
- Timeline: `src/lib/system-timeline.ts` - Collects events from lanes/broadcast/
- Graph component: `src/components/graph/` - React Sigma canvas, toolbar, controls
- Graph data API: `app/api/graph-data/route.ts` - Backend route for graph data

## Common Workflows

### Loading Graph Data
```typescript
import { Graph } from 'graphology';
import { loadGraph } from '@/lib/graph-snapshot';

const graph = loadGraph(data);
```

### Computing Clusters
```typescript
import { computeClusters, findEntryPoints } from '@/lib/graph-clusters';

const clusters = computeClusters(graph);
const entryPoints = findEntryPoints(graph, clusters);
```

### Force-Directed Layout
```typescript
import { ForceAtlas2 } from 'graphology-layout-forceatlas2';
import { useLoadGraph } from '@react-sigma/core';

const layout = new ForceAtlas2(graph, { iterations: 50 });
layout.run();
```

### Graph Snapshots
```typescript
import { saveGraphSnapshot, loadGraphSnapshot, compareGraphs } from '@/lib/graph-snapshot';

// Save current state
const snapshot = saveGraphSnapshot(graph);

// Load previous state
const previousGraph = loadGraphSnapshot(snapshotPath);

// Compare states
const diff = compareGraphs(graph, previousGraph);
```

## Graph Color Constants

Colors are defined in `src/lib/graph-types.ts`:
- Lane colors: Library (blue), Archivist (green), SwarmMind (purple), Kernel (orange)
- Node states: active, pending, verified, rejected
- Edge types: communication, dependency, governance

## Graph Viewer Features

- **Fit button**: Centers visible nodes in the viewport
- **Zoom controls**: Mouse wheel + buttons
- **Node filtering**: Filter by lane, type, or state
- **Cluster view**: Toggle cluster visibility
- **Timeline scrubbing**: View graph state at different points in time

## Performance Tips

1. Use graph clustering for large graphs (>1000 nodes)
2. Batch graph updates to avoid re-renders
3. Use Sigma's WebGL renderer for better performance
4. Enable node reduction for very large graphs
5. Cache computed clusters and entry points

## Debugging

### Graph Not Rendering
- Check WebGL availability in browser
- Verify graph data structure is valid
- Check console for Sigma.js errors
- Ensure @react-sigma/core is properly mounted

### Layout Issues
- Adjust ForceAtlas2 parameters (gravity, repulsion)
- Check for disconnected graph components
- Verify node coordinates are finite numbers
- Try different layout algorithms

### Performance Issues
- Reduce graph size or enable clustering
- Lower ForceAtlas2 iteration count
- Enable Sigma's node reduction
- Check for memory leaks in React components

## API Endpoints

- `GET /api/graph-data` - Returns current graph state
- `POST /api/graph-snapshot` - Saves a graph snapshot
- `GET /api/graph-snapshot/:id` - Loads a specific snapshot
- `GET /api/graph-diff/:id1/:id2` - Compares two snapshots

## Testing

Run graph-related tests:
```bash
npm run test -- graph
```

View graph locally:
```bash
npm run dev
# Visit http://localhost:3000/graph
```
