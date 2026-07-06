/**
 * FTS5 flow — drives the orm v0.10 `fts5` axis end-to-end for the
 * dogfood-sqlite-wal-fts-app. Wraps `createFts5Session` +
 * `createFts5VirtualTable` + `tokenizeFts5Document` + `matchFts5Query` +
 * `inspectFts5Vocab` into a single deterministic op the mock adapter reuses.
 */

import {
  createFts5Session,
  createFts5VirtualTable,
  tokenizeFts5Document,
  matchFts5Query,
  inspectFts5Vocab,
  type Fts5Session,
  type Fts5Tokenizer,
} from '@kiwa-test/orm';

export interface Fts5JourneyInput {
  readonly tableName: string;
  readonly columns: readonly string[];
  readonly tokenizer: Fts5Tokenizer;
  readonly document: string;
  readonly query: string;
  readonly rank: number;
  readonly vocabTerm: string;
  readonly vocabOccurrences: number;
}

export interface Fts5JourneyResult {
  readonly session: Fts5Session;
  readonly tableName: string;
  readonly tokenizer: Fts5Tokenizer;
  readonly tokenCount: number;
  readonly matchRank: number;
  readonly vocabTerm: string;
  readonly vocabOccurrences: number;
  readonly finalState: 'vocab-inspected';
}

/**
 * Drive the FTS5 5-state journey. The state machine transitions
 * empty → virtual-table-created → tokenized → matched → vocab-inspected.
 */
export function driveFts5Journey(input: Fts5JourneyInput): Fts5JourneyResult {
  const session = createFts5Session({
    tableName: input.tableName,
    provider: 'drizzle',
    backend: 'sqlite',
  });
  createFts5VirtualTable(session, {
    columns: [...input.columns],
    tokenizer: input.tokenizer,
  });
  tokenizeFts5Document(session, { document: input.document });
  matchFts5Query(session, { query: input.query, rank: input.rank });
  inspectFts5Vocab(session, {
    term: input.vocabTerm,
    occurrences: input.vocabOccurrences,
  });
  return {
    session,
    tableName: input.tableName,
    tokenizer: input.tokenizer,
    tokenCount: session.tokenCount,
    matchRank: session.lastRank,
    vocabTerm: input.vocabTerm,
    vocabOccurrences: input.vocabOccurrences,
    finalState: 'vocab-inspected',
  };
}
