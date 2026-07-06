import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createFts5Session,
  createFts5VirtualTable,
  inspectFts5Vocab,
  matchFts5Query,
  tokenizeFts5Document,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('fts5 axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: virtual table → tokenize → match → vocab happy path',
    (provider, backend) => {
      const session = createFts5Session({ tableName: 'docs', provider, backend });
      createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'porter' });
      tokenizeFts5Document(session, { document: 'hello searchable world' });
      matchFts5Query(session, { query: 'hello', rank: -1.25 });
      const vocab = inspectFts5Vocab(session, { term: 'hello', occurrences: 1 });
      expect(vocab.neutralEvent).toBe('fts5.vocab-inspected');
      expect(vocab.metadata.occurrences).toBe(1);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for virtual table creation',
    (provider, backend) => {
      const session = createFts5Session({ tableName: 'docs', provider, backend });
      const step = createFts5VirtualTable(session, { columns: ['body'], tokenizer: 'unicode61' });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'fts5.virtual-table-created', provider),
      );
    },
  );

  it('createFts5VirtualTable rejects empty columns', () => {
    const session = createFts5Session({ tableName: 'docs', provider: 'drizzle', backend: 'sqlite' });
    expect(() => createFts5VirtualTable(session, { columns: [], tokenizer: 'porter' })).toThrow(
      /column/,
    );
  });

  it('tokenizeFts5Document rejects empty document', () => {
    const session = createFts5Session({ tableName: 'docs', provider: 'drizzle', backend: 'sqlite' });
    createFts5VirtualTable(session, { columns: ['body'], tokenizer: 'porter' });
    expect(() => tokenizeFts5Document(session, { document: '   ' })).toThrow(/tokens/);
  });

  it('matchFts5Query requires tokenized state', () => {
    const session = createFts5Session({ tableName: 'docs', provider: 'drizzle', backend: 'sqlite' });
    createFts5VirtualTable(session, { columns: ['body'], tokenizer: 'porter' });
    expect(() => matchFts5Query(session, { query: 'hello', rank: 1 })).toThrow(/tokenized/);
  });

  it('inspectFts5Vocab rejects negative occurrences', () => {
    const session = createFts5Session({ tableName: 'docs', provider: 'drizzle', backend: 'sqlite' });
    createFts5VirtualTable(session, { columns: ['body'], tokenizer: 'porter' });
    tokenizeFts5Document(session, { document: 'hello world' });
    matchFts5Query(session, { query: 'hello', rank: 0.1 });
    expect(() => inspectFts5Vocab(session, { term: 'hello', occurrences: -1 })).toThrow(/non-negative/);
  });
});
