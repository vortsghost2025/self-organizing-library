/**
 * Artifact class for the Self-Organizing Library
 * Represents a single artifact (repo, paper, doc, session) in the library
 */

// Simple UUID generator (works in both Node.js and browser)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class Artifact {
  constructor(data = {}) {
    const now = new Date().toISOString();
    
    this.id = data.id || generateUUID();
    this.title = data.title || '';
    this.type = data.type || 'doc';
    this.path = data.path || '';
    this.source = data.source || 'unknown';
    this.status = data.status || 'unknown';
    this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
    this.metadata = {
      created: data.metadata?.created || now,
      modified: data.metadata?.modified || now,
      size: data.metadata?.size || 0,
      wordCount: data.metadata?.wordCount || 0,
      extension: data.metadata?.extension || '',
      ...(data.metadata || {})
    };
    this.relations = Array.isArray(data.relations) ? [...data.relations] : [];
    this.notes = data.notes || '';
  }

  validate() {
    const errors = [];

    // Required fields
    if (!this.id) errors.push('id is required');
    if (!this.title) errors.push('title is required');
    if (!this.path) errors.push('path is required');

    // Type validation
    const validTypes = ['repo', 'paper', 'doc', 'session'];
    if (!validTypes.includes(this.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }

    // Status validation
    const validStatuses = ['canonical', 'bridge', 'archive', 'unknown'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Source validation
    const validSources = ['C:', 'S:', 'web', 'manual', 'unknown'];
    if (!validSources.includes(this.source)) {
      errors.push(`source must be one of: ${validSources.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      path: this.path,
      source: this.source,
      status: this.status,
      tags: [...this.tags],
      metadata: { ...this.metadata },
      relations: [...this.relations],
      notes: this.notes
    };
  }

  static fromJSON(json) {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    return new Artifact(json);
  }

  update(updates) {
    const now = new Date().toISOString();
    
    if (updates.title !== undefined) this.title = updates.title;
    if (updates.type !== undefined) this.type = updates.type;
    if (updates.path !== undefined) this.path = updates.path;
    if (updates.source !== undefined) this.source = updates.source;
    if (updates.status !== undefined) this.status = updates.status;
    if (updates.tags !== undefined) this.tags = [...updates.tags];
    if (updates.notes !== undefined) this.notes = updates.notes;
    if (updates.relations !== undefined) this.relations = [...updates.relations];
    
    // Always update modified timestamp
    this.metadata.modified = now;
    
    return this.validate();
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.metadata.modified = new Date().toISOString();
    }
    return this;
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.metadata.modified = new Date().toISOString();
    }
    return this;
  }

  addRelation(artifactId) {
    if (!this.relations.includes(artifactId)) {
      this.relations.push(artifactId);
      this.metadata.modified = new Date().toISOString();
    }
    return this;
  }

  removeRelation(artifactId) {
    const index = this.relations.indexOf(artifactId);
    if (index > -1) {
      this.relations.splice(index, 1);
      this.metadata.modified = new Date().toISOString();
    }
    return this;
  }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Artifact, generateUUID };
} else if (typeof window !== 'undefined') {
  window.Artifact = Artifact;
  window.generateUUID = generateUUID;
}
