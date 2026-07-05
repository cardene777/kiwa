/**
 * Document store — every row carries a body (BM25 tokenized), an embedding
 * (fixed-dimension vector), and a stable id. Production SvelteKit
 * `src/routes/index/+server.ts` calls `upsert` on every index request; the
 * index UI drives re-index on demand. The mock reproduces the shape a
 * `pgvector`-backed `documents` table exposes:
 *
 *   id             text primary key
 *   body           text
 *   embedding      vector(N)
 *   updated_at     timestamptz
 *
 * BM25 scoring is a small, deterministic, ranking-only helper: it is *not*
 * a production text-search implementation. The scope of the mock is to
 * make hybrid ranking observable side-by-side with cosine / L2 scores so
 * the fidelity harness diffs the same weighted sort against `real`.
 */

export interface DocumentRow {
  readonly documentId: string;
  readonly body: string;
  readonly embedding: readonly number[];
}

export interface DocumentStore {
  readonly upsert: (row: DocumentRow) => void;
  readonly all: () => readonly DocumentRow[];
  readonly findById: (id: string) => DocumentRow | undefined;
  readonly size: () => number;
  readonly dimensions: () => number | null;
  readonly reset: () => void;
}

/**
 * In-memory document store. `dimensions` is captured from the first
 * `upsert` and enforced on every subsequent write — mirrors what a
 * pgvector `vector(N)` column check does at INSERT time. A dimension
 * mismatch throws so the tests can assert on the invariant.
 */
export function createDocumentStore(): DocumentStore {
  const rows = new Map<string, DocumentRow>();
  let capturedDim: number | null = null;
  return {
    upsert(row: DocumentRow): void {
      if (row.documentId.length === 0) {
        throw new Error('upsert: documentId required');
      }
      if (row.embedding.length === 0) {
        throw new Error('upsert: embedding required');
      }
      if (capturedDim === null) {
        capturedDim = row.embedding.length;
      } else if (row.embedding.length !== capturedDim) {
        throw new Error(
          `upsert: embedding dim ${row.embedding.length} != store dim ${capturedDim}`,
        );
      }
      rows.set(row.documentId, row);
    },
    all(): readonly DocumentRow[] {
      return [...rows.values()];
    },
    findById(id: string): DocumentRow | undefined {
      return rows.get(id);
    },
    size(): number {
      return rows.size;
    },
    dimensions(): number | null {
      return capturedDim;
    },
    reset(): void {
      rows.clear();
      capturedDim = null;
    },
  };
}

/**
 * Deterministic BM25-shaped keyword score. Returns a value in [0, 1]:
 *   score = matchedTermCount / max(1, totalQueryTerms)
 * Not a production BM25 — hybrid ranking only needs a monotonic score
 * that agrees across mock and real when the same corpus is queried, and
 * this shape keeps the fidelity harness's per-op comparison purely
 * deterministic. Terms are split on ASCII whitespace and lowercased.
 */
export function bm25Score(body: string, keyword: string): number {
  const bodyTerms = new Set(body.toLowerCase().split(/\s+/).filter(Boolean));
  const queryTerms = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return 0;
  let matched = 0;
  for (const q of queryTerms) {
    if (bodyTerms.has(q)) matched += 1;
  }
  return matched / queryTerms.length;
}
