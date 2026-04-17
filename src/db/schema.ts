import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Documents - Main document store
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type", { enum: ["text", "code", "paper", "link", "note"] }).default("text").notNull(),
  sourceUrl: text("source_url"),
  wordCount: integer("word_count").default(0),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  titleIdx: index("documents_title_idx").on(table.title),
  typeIdx: index("documents_type_idx").on(table.type),
}));

// Tags - Tag definitions with colors
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").default("#7C3AED"),
});

// Document Tags - Many-to-many junction
export const documentTags = sqliteTable("document_tags", {
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: index("document_tags_pk").on(table.documentId, table.tagId),
}));

// Links - Bi-directional document links
export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  targetId: integer("target_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  context: text("context"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  sourceIdx: index("links_source_idx").on(table.sourceId),
  targetIdx: index("links_target_idx").on(table.targetId),
}));

// Sources - External source connectors
export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["github", "medium", "doi", "twitter", "custom"] }).notNull(),
  name: text("name").notNull(),
  config: text("config"), // JSON string for API keys, URLs, etc.
  lastSync: integer("last_sync", { mode: "timestamp" }),
  status: text("status", { enum: ["connected", "error", "pending"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Collections - User-defined document groupings
export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isAuto: integer("is_auto", { mode: "boolean" }).default(false),
  autoQuery: text("auto_query"), // JSON query for auto-collections
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Document Collections - Many-to-many junction
export const documentCollections = sqliteTable("document_collections", {
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: index("document_collections_pk").on(table.documentId, table.collectionId),
}));

// Search Index - Full-text search with embeddings
export const searchIndex = sqliteTable("search_index", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }).unique(),
  content: text("content"), // Extracted text for search
  embedding: text("embedding"), // JSON array of embedding vector
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  documentIdx: index("search_index_document_idx").on(table.documentId),
}));

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  tags: many(documentTags),
  links: many(links),
  collections: many(documentCollections),
  searchIndex: many(searchIndex),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  documents: many(documentTags),
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id],
  }),
  tag: one(tags, {
    fields: [documentTags.tagId],
    references: [tags.id],
  }),
}));

export const linksRelations = relations(links, ({ one }) => ({
  source: one(documents, {
    fields: [links.sourceId],
    references: [documents.id],
    relationName: "sourceLinks",
  }),
  target: one(documents, {
    fields: [links.targetId],
    references: [documents.id],
    relationName: "targetLinks",
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  documents: many(documentCollections),
}));

export const documentCollectionsRelations = relations(documentCollections, ({ one }) => ({
  document: one(documents, {
    fields: [documentCollections.documentId],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [documentCollections.collectionId],
    references: [collections.id],
  }),
}));

// Types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
