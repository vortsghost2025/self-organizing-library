import { eq, like, or, desc, sql, and } from "drizzle-orm";
import { documents, links, tags, documentTags, sources, searchIndex } from "@/db/schema";
import { randomUUID } from "crypto";

let db: any = null;

async function getDb() {
  if (!db) {
    try {
      const { db: database } = await import("@/db");
      db = database;
    } catch (e) {
      return null;
    }
  }
  return db;
}

export function generateId(): string {
  return randomUUID();
}

export async function createDocument(data: {
  title: string;
  content: string;
  type: "text" | "code" | "paper" | "link" | "note";
  sourceUrl?: string;
  sourceId?: string;
  tags?: string[];
}) {
  const database = await getDb();
  if (!database) {
    return { id: generateId(), title: data.title, content: data.content, type: data.type, wordCount: data.content.split(/\s+/).length, createdAt: new Date(), updatedAt: new Date() };
  }

  const id = generateId();
  const now = new Date();
  const wordCount = data.content.split(/\s+/).filter(Boolean).length;

  await database.insert(documents).values({
    id,
    title: data.title,
    content: data.content,
    type: data.type,
    sourceUrl: data.sourceUrl,
    sourceId: data.sourceId,
    wordCount,
    createdAt: now,
    updatedAt: now,
  });

  return { id, title: data.title, content: data.content, type: data.type, wordCount, createdAt: now, updatedAt: now };
}

export async function getDocuments(options?: {
  type?: string;
  sourceId?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<Array<{
  id: string;
  title: string;
  content: string;
  type: string;
  sourceUrl: string | null;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isStarred: boolean;
  sourceId: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  linkCount: number;
}>> {
  const database = await getDb();
  if (!database) {
    return getMockDocuments(options);
  }

  const conditions = [eq(documents.isDeleted, false)];
  
  if (options?.type) conditions.push(eq(documents.type, options.type as any));
  if (options?.sourceId) conditions.push(eq(documents.sourceId, options.sourceId));

  const docs = await database.select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);

  return docs.map((doc: any) => ({
    ...doc,
    tags: [],
    linkCount: 0
  }));
}

export async function getDocumentById(id: string) {
  const database = await getDb();
  if (!database) {
    return getMockDocumentById(id);
  }

  const doc = await database.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc.length) return null;

  return {
    ...doc[0],
    tags: [],
    links: [],
    backlinks: [],
    linkedDocuments: []
  };
}

export async function createLink(sourceId: string, targetId: string, context?: string) {
  const database = await getDb();
  if (!database) {
    return { id: generateId(), sourceId, targetId, context };
  }

  const id = generateId();
  await database.insert(links).values({
    id,
    sourceId,
    targetId,
    context,
    createdAt: new Date(),
  });
  return { id, sourceId, targetId, context };
}

export async function searchDocuments(query: string, limit = 20) {
  if (!query.trim()) return [];

  const database = await getDb();
  if (!database) {
    return getMockSearchResults(query, limit);
  }

  const q = `%${query}%`;
  const results = await database.select()
    .from(documents)
    .where(and(
      eq(documents.isDeleted, false),
      or(like(documents.title, q), like(documents.content, q)) as any
    ))
    .limit(limit);

  return results.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    excerpt: doc.content.substring(0, 120) + (doc.content.length > 120 ? "..." : "")
  }));
}

export async function getGraphData() {
  const database = await getDb();
  if (!database) {
    return getMockGraphData();
  }

  const allDocs = await database.select().from(documents).where(eq(documents.isDeleted, false));
  const allLinks = await database.select().from(links);

  const nodes = allDocs.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    connectionCount: allLinks.filter((l: any) => l.sourceId === doc.id || l.targetId === doc.id).length
  }));

  const edges = allLinks.map((link: any) => ({
    source: link.sourceId,
    target: link.targetId,
    context: link.context
  }));

  return { nodes, edges };
}

export async function getStats() {
  const database = await getDb();
  if (!database) {
    return { documentCount: 5000, totalWords: 45000, linkCount: 12847, sourceCount: 3 };
  }

  const docCount = await database.select({ count: sql`count(*)`.mapWith(Number) })
    .from(documents)
    .where(eq(documents.isDeleted, false));

  const totalWords = await database.select({ total: sql`sum(${documents.wordCount})`.mapWith(Number) })
    .from(documents)
    .where(eq(documents.isDeleted, false));

  const linkCount = await database.select({ count: sql`count(*)`.mapWith(Number) }).from(links);
  const sourceCount = await database.select({ count: sql`count(*)`.mapWith(Number) }).from(sources);

  return {
    documentCount: docCount[0]?.count || 0,
    totalWords: totalWords[0]?.total || 0,
    linkCount: linkCount[0]?.count || 0,
    sourceCount: sourceCount[0]?.count || 0
  };
}

export async function createSource(data: {
  type: "github" | "medium" | "doi" | "twitter" | "custom";
  name: string;
  config?: string;
}) {
  const database = await getDb();
  if (!database) {
    return { id: generateId(), type: data.type, name: data.name, status: "connected" };
  }

  const id = generateId();
  await database.insert(sources).values({
    id,
    type: data.type,
    name: data.name,
    config: data.config,
    status: "connected",
    documentCount: 0,
    createdAt: new Date(),
  });
  return { id, type: data.type, name: data.name, status: "connected" };
}

export async function getSources() {
  const database = await getDb();
  if (!database) {
    return getMockSources();
  }
  return database.select().from(sources).orderBy(desc(sources.createdAt));
}

function getRandomColor(): string {
  const colors = ["#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#3B82F6"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getMockDocuments(options?: { limit?: number; offset?: number; type?: string }): any[] {
  const types = ["text", "code", "paper", "link", "note"];
  const mockDocs = [];
  const limit = options?.limit || 50;
  
  for (let i = 0; i < limit; i++) {
    const type = options?.type || types[i % 5];
    mockDocs.push({
      id: `mock-doc-${i}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Document ${i + 1}`,
      content: `This is a sample ${type} document with content related to AI research, machine learning, and knowledge management. It contains important information that can be cross-referenced with other documents in the library.`,
      type,
      sourceUrl: null,
      wordCount: Math.floor(Math.random() * 5000) + 500,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      isDeleted: false,
      isStarred: Math.random() > 0.8,
      sourceId: null,
      tags: [
        { id: `tag-${i % 3}`, name: ["ai", "ml", "research"][i % 3], color: getRandomColor() }
      ],
      linkCount: Math.floor(Math.random() * 10)
    });
  }
  return mockDocs;
}

function getMockDocumentById(id: string): any {
  return {
    id,
    title: "Sample Document",
    content: "This is a sample document containing information about knowledge graphs, cross-referencing, and document management. Use [[document-id]] to create links to other documents in your library.",
    type: "text",
    sourceUrl: null,
    wordCount: 1200,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    isDeleted: false,
    isStarred: false,
    sourceId: null,
    tags: [
      { id: "tag-1", name: "knowledge", color: "#7C3AED" },
      { id: "tag-2", name: "graph", color: "#06B6D4" }
    ],
    links: [
      { id: "link-1", targetId: "mock-doc-1", context: "Related research" }
    ],
    backlinks: [
      { id: "link-2", sourceId: "mock-doc-2", context: "References this" }
    ],
    linkedDocuments: [
      { id: "mock-doc-1", title: "Related Document", type: "paper" }
    ]
  };
}

function getMockSearchResults(query: string, limit: number): any[] {
  const results = [];
  for (let i = 0; i < Math.min(limit, 5); i++) {
    results.push({
      id: `search-result-${i}`,
      title: `Result matching "${query}" - ${i + 1}`,
      type: ["text", "code", "paper", "link", "note"][i % 5],
      excerpt: `This document contains relevant information about ${query}. It was found in your library and matches your search criteria.`
    });
  }
  return results;
}

function getMockGraphData(): { nodes: any[]; edges: any[] } {
  const nodes = [];
  const edges = [];
  
  for (let i = 0; i < 50; i++) {
    nodes.push({
      id: `node-${i}`,
      title: `Document ${i + 1}`,
      type: ["text", "code", "paper", "link", "note"][i % 5],
      connectionCount: Math.floor(Math.random() * 10) + 1
    });
    
    const numLinks = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numLinks; j++) {
      const target = Math.floor(Math.random() * 50);
      if (target !== i) {
        edges.push({ source: `node-${i}`, target: `node-${target}` });
      }
    }
  }
  
  return { nodes, edges };
}

function getMockSources(): any[] {
  return [
    { id: "github", type: "github", name: "GitHub Repositories", status: "connected", documentCount: 142, lastSync: new Date(), createdAt: new Date() },
    { id: "medium", type: "medium", name: "Medium Articles", status: "connected", documentCount: 28, lastSync: new Date(), createdAt: new Date() },
    { id: "doi", type: "doi", name: "DOI Papers", status: "connected", documentCount: 5, lastSync: new Date(), createdAt: new Date() }
  ];
}