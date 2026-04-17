/**
 * Registry class for the Self-Organizing Library
 * Manages the collection of artifacts with indexing and search
 */

class Registry {
  constructor() {
    this.artifacts = new Map();
    this.pathIndex = new Map();
    this.typeIndex = new Map();
    this.statusIndex = new Map();
    this.tagIndex = new Map();
  }

  // Register a new artifact
  register(artifact) {
    // Validate artifact
    const validation = artifact.validate();
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Check for duplicate path
    if (this.pathIndex.has(artifact.path)) {
      return { 
        success: false, 
        errors: [`Artifact with path "${artifact.path}" already exists`] 
      };
    }

    // Add to main collection
    this.artifacts.set(artifact.id, artifact);

    // Update indexes
    this.pathIndex.set(artifact.path, artifact.id);
    this.addToIndex(this.typeIndex, artifact.type, artifact.id);
    this.addToIndex(this.statusIndex, artifact.status, artifact.id);
    artifact.tags.forEach(tag => this.addToIndex(this.tagIndex, tag, artifact.id));

    return { success: true, artifact };
  }

  // Helper to add to multi-value indexes
  addToIndex(index, key, id) {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key).add(id);
  }

  // Helper to remove from multi-value indexes
  removeFromIndex(index, key, id) {
    if (index.has(key)) {
      index.get(key).delete(id);
      if (index.get(key).size === 0) {
        index.delete(key);
      }
    }
  }

  // Get artifact by ID
  get(id) {
    return this.artifacts.get(id) || null;
  }

  // Find by path
  findByPath(path) {
    const id = this.pathIndex.get(path);
    return id ? this.artifacts.get(id) : null;
  }

  // Find by type
  findByType(type) {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.artifacts.get(id));
  }

  // Find by status
  findByStatus(status) {
    const ids = this.statusIndex.get(status);
    if (!ids) return [];
    return Array.from(ids).map(id => this.artifacts.get(id));
  }

  // Find by tag
  findByTag(tag) {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    return Array.from(ids).map(id => this.artifacts.get(id));
  }

  // Full-text search
  search(query, filters = {}) {
    const queryLower = query.toLowerCase();
    let results = Array.from(this.artifacts.values());

    // Apply filters first
    if (filters.type) {
      results = results.filter(a => a.type === filters.type);
    }
    if (filters.status) {
      results = results.filter(a => a.status === filters.status);
    }
    if (filters.source) {
      results = results.filter(a => a.source === filters.source);
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(a => 
        filters.tags.some(tag => a.tags.includes(tag))
      );
    }

    // Apply text search
    if (query && query.trim()) {
      results = results.filter(a => {
        const titleMatch = a.title.toLowerCase().includes(queryLower);
        const notesMatch = a.notes.toLowerCase().includes(queryLower);
        const pathMatch = a.path.toLowerCase().includes(queryLower);
        const tagsMatch = a.tags.some(t => t.toLowerCase().includes(queryLower));
        return titleMatch || notesMatch || pathMatch || tagsMatch;
      });
    }

    // Sort by modified date (most recent first)
    results.sort((a, b) => 
      new Date(b.metadata.modified) - new Date(a.metadata.modified)
    );

    return results;
  }

  // Update artifact
  update(id, updates) {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return { success: false, errors: ['Artifact not found'] };
    }

    // Update indexes for changed fields
    if (updates.type && updates.type !== artifact.type) {
      this.removeFromIndex(this.typeIndex, artifact.type, id);
      this.addToIndex(this.typeIndex, updates.type, id);
    }
    if (updates.status && updates.status !== artifact.status) {
      this.removeFromIndex(this.statusIndex, artifact.status, id);
      this.addToIndex(this.statusIndex, updates.status, id);
    }
    if (updates.tags) {
      artifact.tags.forEach(tag => this.removeFromIndex(this.tagIndex, tag, id));
      updates.tags.forEach(tag => this.addToIndex(this.tagIndex, tag, id));
    }

    // Apply update
    const validation = artifact.update(updates);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    return { success: true, artifact };
  }

  // Remove artifact
  remove(id) {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return { success: false, errors: ['Artifact not found'] };
    }

    // Remove from all indexes
    this.artifacts.delete(id);
    this.pathIndex.delete(artifact.path);
    this.removeFromIndex(this.typeIndex, artifact.type, id);
    this.removeFromIndex(this.statusIndex, artifact.status, id);
    artifact.tags.forEach(tag => this.removeFromIndex(this.tagIndex, tag, id));

    return { success: true };
  }

  // Export all artifacts
  export() {
    return Array.from(this.artifacts.values()).map(a => a.toJSON());
  }

  // Import artifacts
  import(artifacts) {
    let imported = 0;
    let errors = [];

    for (const data of artifacts) {
      const artifact = new Artifact(data);
      const result = this.register(artifact);
      if (result.success) {
        imported++;
      } else {
        errors.push({ artifact: data.title || data.id, errors: result.errors });
      }
    }

    return { imported, errors };
  }

  // Get statistics
  getStats() {
    const stats = {
      total: this.artifacts.size,
      byType: {},
      byStatus: {},
      bySource: {},
      allTags: []
    };

    for (const artifact of this.artifacts.values()) {
      stats.byType[artifact.type] = (stats.byType[artifact.type] || 0) + 1;
      stats.byStatus[artifact.status] = (stats.byStatus[artifact.status] || 0) + 1;
      stats.bySource[artifact.source] = (stats.bySource[artifact.source] || 0) + 1;
    }

    stats.allTags = Array.from(this.tagIndex.keys()).sort();

    return stats;
  }

  // Get all unique values for a field
  getUniqueValues(field) {
    const values = new Set();
    for (const artifact of this.artifacts.values()) {
      if (field === 'tags') {
        artifact.tags.forEach(t => values.add(t));
      } else if (artifact[field]) {
        values.add(artifact[field]);
      }
    }
    return Array.from(values).sort();
  }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Registry };
} else if (typeof window !== 'undefined') {
  window.Registry = Registry;
}
