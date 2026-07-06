import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * FTS5 — SQLite virtual-table creation, tokenizer configuration, MATCH
 * ranking, and vocab-table inspection. SQLite maps to FTS5 / fts5vocab;
 * Postgres approximates with tsvector / tsquery; MySQL approximates with
 * FULLTEXT / MATCH AGAINST.
 *
 * State transitions:
 *   created                 → 'empty'
 *   createFts5VirtualTable  → 'virtual-table-created'
 *   tokenizeFts5Document    → 'tokenized'
 *   matchFts5Query          → 'matched'
 *   inspectFts5Vocab        → 'vocab-inspected'
 */
export type Fts5State =
  | 'empty'
  | 'virtual-table-created'
  | 'tokenized'
  | 'matched'
  | 'vocab-inspected';

export type Fts5Tokenizer = 'unicode61' | 'porter' | 'trigram';

export interface Fts5Session {
  tableName: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: Fts5State;
  columns: string[];
  tokenizer: Fts5Tokenizer | null;
  tokenCount: number;
  lastRank: number;
  history: AxisStep<Fts5State>[];
}

function record(session: Fts5Session, step: AxisStep<Fts5State>): AxisStep<Fts5State> {
  session.history.push(step);
  return step;
}

export function createFts5Session(input: {
  tableName: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): Fts5Session {
  return {
    tableName: input.tableName,
    provider: input.provider,
    backend: input.backend,
    state: 'empty',
    columns: [],
    tokenizer: null,
    tokenCount: 0,
    lastRank: 0,
    history: [],
  };
}

export function createFts5VirtualTable(
  session: Fts5Session,
  input: { columns: string[]; tokenizer: Fts5Tokenizer },
): AxisStep<Fts5State> {
  if (session.state !== 'empty') {
    throw new Error(`createFts5VirtualTable: requires empty state (got ${session.state})`);
  }
  if (input.columns.length === 0) {
    throw new Error('createFts5VirtualTable: at least one column is required');
  }
  session.columns = [...input.columns];
  session.tokenizer = input.tokenizer;
  session.state = 'virtual-table-created';
  return record(session, {
    neutralEvent: 'fts5.virtual-table-created',
    backendEvent: backendEventName(session.backend, 'fts5.virtual-table-created', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      tableName: session.tableName,
      columnCount: input.columns.length,
      tokenizer: input.tokenizer,
    },
  });
}

export function tokenizeFts5Document(
  session: Fts5Session,
  input: { document: string },
): AxisStep<Fts5State> {
  if (session.state !== 'virtual-table-created' && session.state !== 'tokenized') {
    throw new Error(`tokenizeFts5Document: requires virtual-table-created state (got ${session.state})`);
  }
  const tokenCount = input.document.trim().split(/\s+/).filter(Boolean).length;
  if (tokenCount === 0) {
    throw new Error('tokenizeFts5Document: document must contain tokens');
  }
  session.tokenCount = tokenCount;
  session.state = 'tokenized';
  return record(session, {
    neutralEvent: 'fts5.tokenized',
    backendEvent: backendEventName(session.backend, 'fts5.tokenized', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      tokenCount,
      tokenizer: session.tokenizer ?? 'unicode61',
    },
  });
}

export function matchFts5Query(
  session: Fts5Session,
  input: { query: string; rank: number },
): AxisStep<Fts5State> {
  if (session.state !== 'tokenized' && session.state !== 'matched') {
    throw new Error(`matchFts5Query: requires tokenized state (got ${session.state})`);
  }
  if (!input.query) {
    throw new Error('matchFts5Query: query is required');
  }
  if (!Number.isFinite(input.rank)) {
    throw new Error('matchFts5Query: rank must be finite');
  }
  session.lastRank = input.rank;
  session.state = 'matched';
  return record(session, {
    neutralEvent: 'fts5.matched',
    backendEvent: backendEventName(session.backend, 'fts5.matched', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      query: input.query,
      rank: input.rank,
    },
  });
}

export function inspectFts5Vocab(
  session: Fts5Session,
  input: { term: string; occurrences: number },
): AxisStep<Fts5State> {
  if (session.state !== 'matched' && session.state !== 'vocab-inspected') {
    throw new Error(`inspectFts5Vocab: requires matched state (got ${session.state})`);
  }
  if (!input.term) {
    throw new Error('inspectFts5Vocab: term is required');
  }
  if (input.occurrences < 0) {
    throw new Error('inspectFts5Vocab: occurrences must be non-negative');
  }
  session.state = 'vocab-inspected';
  return record(session, {
    neutralEvent: 'fts5.vocab-inspected',
    backendEvent: backendEventName(session.backend, 'fts5.vocab-inspected', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      term: input.term,
      occurrences: input.occurrences,
    },
  });
}
