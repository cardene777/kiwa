import type {
  SearchAdapter,
  SearchDocument,
  SearchHit,
  SearchProvider,
  SearchQuery,
  SearchResult,
} from './types.js';

/**
 * Shared search engine. In-memory index with deterministic ranking so
 * fixture tests can assert on top-k order. Not intended to compete with
 * a real search server on performance — the goal is provider-shape parity
 * for tests.
 *
 * Ranking = word-overlap score. For each hit, score = (matching tokens
 * across all string fields) / (total tokens in query). Ties broken by
 * insertion order (stable). Typo tolerance is off by default — providers
 * that support it (Meilisearch / Algolia / Typesense) apply a 1-character
 * substitution allowance when {@link EngineConfig.typoTolerance} is set.
 */
export interface EngineConfig {
  provider: SearchProvider;
  typoTolerance?: boolean;
}

interface IndexState {
  docs: Map<string, SearchDocument>;
}

export class SearchEngine implements SearchAdapter {
  readonly provider: SearchProvider;
  private readonly typoTolerance: boolean;
  private readonly indices = new Map<string, IndexState>();

  constructor(config: EngineConfig) {
    this.provider = config.provider;
    this.typoTolerance = config.typoTolerance ?? false;
  }

  async addDocuments<T extends SearchDocument>(
    index: string,
    docs: T[],
  ): Promise<{ inserted: number }> {
    const state = this.ensureIndex(index);
    let inserted = 0;
    for (const doc of docs) {
      if (!state.docs.has(doc.id)) inserted += 1;
      state.docs.set(doc.id, { ...doc });
    }
    return { inserted };
  }

  async updateDocuments<T extends SearchDocument>(
    index: string,
    docs: T[],
  ): Promise<{ updated: number }> {
    const state = this.ensureIndex(index);
    let updated = 0;
    for (const doc of docs) {
      const existing = state.docs.get(doc.id);
      if (existing) {
        state.docs.set(doc.id, { ...existing, ...doc });
        updated += 1;
      } else {
        state.docs.set(doc.id, { ...doc });
      }
    }
    return { updated };
  }

  async deleteDocuments(index: string, ids: string[]): Promise<{ deleted: number }> {
    const state = this.ensureIndex(index);
    let deleted = 0;
    for (const id of ids) {
      if (state.docs.delete(id)) deleted += 1;
    }
    return { deleted };
  }

  async search<T extends SearchDocument = SearchDocument>(
    index: string,
    query: SearchQuery,
  ): Promise<SearchResult<T>> {
    const state = this.ensureIndex(index);
    const start = Date.now();
    const tokens = tokenize(query.q);
    const filtered = this.applyFilter([...state.docs.values()], query.filter);
    const scored: Array<SearchHit<T>> = [];
    for (const doc of filtered) {
      const { score, matchedFields } = this.scoreDoc(doc, tokens);
      if (tokens.length === 0 || score > 0) {
        scored.push({ document: doc as T, score, matchedFields });
      }
    }
    this.applySort(scored, query.sort);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;
    const pagedHits = scored.slice(offset, offset + limit);
    const facetDistribution = this.buildFacets(filtered, query.facets);
    return {
      hits: pagedHits,
      totalHits: scored.length,
      facetDistribution,
      processingTimeMs: Math.max(0, Date.now() - start),
      query: query.q,
    };
  }

  async clearIndex(index: string): Promise<void> {
    this.indices.delete(index);
  }

  getIndexStats(index: string): { docCount: number } {
    const state = this.indices.get(index);
    return { docCount: state?.docs.size ?? 0 };
  }

  private ensureIndex(index: string): IndexState {
    let state = this.indices.get(index);
    if (!state) {
      state = { docs: new Map() };
      this.indices.set(index, state);
    }
    return state;
  }

  private applyFilter(
    docs: SearchDocument[],
    filter: Record<string, unknown> | undefined,
  ): SearchDocument[] {
    if (!filter) return docs;
    return docs.filter((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) return false;
      }
      return true;
    });
  }

  private scoreDoc(
    doc: SearchDocument,
    tokens: string[],
  ): { score: number; matchedFields: string[] } {
    if (tokens.length === 0) return { score: 0, matchedFields: [] };
    const matchedFields = new Set<string>();
    let matches = 0;
    for (const [field, raw] of Object.entries(doc)) {
      if (typeof raw !== 'string') continue;
      const docTokens = tokenize(raw);
      for (const token of tokens) {
        if (docTokens.includes(token)) {
          matches += 1;
          matchedFields.add(field);
          continue;
        }
        if (this.typoTolerance && docTokens.some((dt) => typoMatch(dt, token))) {
          matches += 0.5;
          matchedFields.add(field);
        }
      }
    }
    return { score: matches / tokens.length, matchedFields: [...matchedFields] };
  }

  private applySort(hits: Array<SearchHit<SearchDocument>>, sort: string[] | undefined): void {
    if (!sort || sort.length === 0) {
      hits.sort((a, b) => b.score - a.score);
      return;
    }
    hits.sort((a, b) => {
      for (const key of sort) {
        const desc = key.startsWith('-');
        const field = desc ? key.slice(1) : key;
        const av = a.document[field];
        const bv = b.document[field];
        if (av === bv) continue;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        const cmp = (av as string | number) < (bv as string | number) ? -1 : 1;
        return desc ? -cmp : cmp;
      }
      return b.score - a.score;
    });
  }

  private buildFacets(
    docs: SearchDocument[],
    facets: string[] | undefined,
  ): Record<string, Record<string, number>> {
    if (!facets || facets.length === 0) return {};
    const out: Record<string, Record<string, number>> = {};
    for (const facet of facets) {
      const dist: Record<string, number> = {};
      for (const doc of docs) {
        const raw = doc[facet];
        if (typeof raw !== 'string' && typeof raw !== 'number') continue;
        const key = String(raw);
        dist[key] = (dist[key] ?? 0) + 1;
      }
      out[facet] = dist;
    }
    return out;
  }
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s\-_.,;:!?()"']+/)
    .filter((t) => t.length > 0);
}

function typoMatch(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  // 1-edit-distance heuristic — sufficient for kiwa fixture tests.
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter === longer) return true;
  let diffs = 0;
  let i = 0;
  let j = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] !== longer[j]) {
      diffs += 1;
      if (diffs > 1) return false;
      if (shorter.length === longer.length) {
        i += 1;
        j += 1;
      } else {
        j += 1;
      }
    } else {
      i += 1;
      j += 1;
    }
  }
  if (j < longer.length) diffs += longer.length - j;
  return diffs <= 1;
}
