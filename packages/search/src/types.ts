export type SearchProvider = 'meilisearch' | 'algolia' | 'typesense';

export interface SearchDocument {
  id: string;
  [field: string]: unknown;
}

export interface SearchHit<T extends SearchDocument = SearchDocument> {
  document: T;
  score: number;
  matchedFields: string[];
}

export interface SearchQuery {
  q: string;
  filter?: Record<string, unknown>;
  facets?: string[];
  limit?: number;
  offset?: number;
  sort?: string[];
}

export interface SearchResult<T extends SearchDocument = SearchDocument> {
  hits: SearchHit<T>[];
  totalHits: number;
  facetDistribution: Record<string, Record<string, number>>;
  processingTimeMs: number;
  query: string;
}

export interface SearchAdapter {
  readonly provider: SearchProvider;
  addDocuments<T extends SearchDocument>(index: string, docs: T[]): Promise<{ inserted: number }>;
  updateDocuments<T extends SearchDocument>(index: string, docs: T[]): Promise<{ updated: number }>;
  deleteDocuments(index: string, ids: string[]): Promise<{ deleted: number }>;
  search<T extends SearchDocument = SearchDocument>(index: string, query: SearchQuery): Promise<SearchResult<T>>;
  clearIndex(index: string): Promise<void>;
  getIndexStats(index: string): { docCount: number };
}
