export interface RagieDocument {
  id: string;
  name: string;
  status: "pending" | "partitioned" | "refined" | "chunked" | "indexed" | "ready" | "failed";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeCard {
  id: string;
  documentId: string;
  documentName: string;
  createdAt: string;
  summary: string;
  mainTopics: string[];
  typicalProblems: string[];
  safetyNotes: string[];
}

export interface QuerySource {
  documentId: string;
  documentName: string;
  score: number;
  text: string;
  timestamp?: string;
}

export interface QueryResult {
  answer: string;
  sources: QuerySource[];
  durationMs: number;
}

export interface UploadResponse {
  document: RagieDocument;
  knowledgeCard: KnowledgeCard;
}
