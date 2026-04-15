import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type", { enum: ["text", "code", "paper", "link", "note"] }).notNull().default("text"),
  sourceUrl: text("source_url"),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).notNull().default(false),
  sourceId: text("source_id").references(() => sources.id),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#7C3AED"),
});

export const documentTags = sqliteTable("document_tags", {
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }),
  tagId: text("tag_id").references(() => tags.id, { onDelete: "cascade" }),
});

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  targetId: text("target_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  context: text("context"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["github", "medium", "doi", "twitter", "custom"] }).notNull(),
  name: text("name").notNull(),
  config: text("config"),
  lastSync: integer("last_sync", { mode: "timestamp" }),
  status: text("status", { enum: ["connected", "error", "syncing"] }).notNull().default("connected"),
  documentCount: integer("document_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isAuto: integer("is_auto", { mode: "boolean" }).notNull().default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const documentCollections = sqliteTable("document_collections", {
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }),
  collectionId: text("collection_id").references(() => collections.id, { onDelete: "cascade" }),
});

export const searchIndex = sqliteTable("search_index", {
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }).primaryKey(),
  titleTokens: text("title_tokens"),
  contentTokens: text("content_tokens"),
  embedding: text("embedding"),
});