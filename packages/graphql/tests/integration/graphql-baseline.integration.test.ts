/**
 * integration test — graphql domain の end-to-end workflow (schema 定義 → client query →
 * mutation → server call inspection → subscription iterate) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createGraphQLServer,
  createGraphQLClient,
  subscribeSubscription,
} from '../../src/index.js';

describe('graphql integration — server + client + subscription workflow', () => {
  it('T-INT-G-001 client.query が server.executeQuery を dispatch + call 記録', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const client = createGraphQLClient({ server });
    const res = await client.query('{ hello }');
    expect(res.data).toEqual({ hello: 'world' });
    expect(server.listCalls().length).toBe(1);
    expect(server.listCalls()[0]!.operationType).toBe('query');
  });

  it('T-INT-G-002 mutation で state 更新 → query で新 state 取得', async () => {
    const store = new Map<string, string>();
    const server = createGraphQLServer(
      { typeDefs: 'type Query { get(key: String!): String } type Mutation { set(key: String!, value: String!): String }' },
      {
        Query: { get: (args) => store.get(String(args.key)) ?? null },
        Mutation: {
          set: (args) => {
            store.set(String(args.key), String(args.value));
            return String(args.value);
          },
        },
      },
    );
    const client = createGraphQLClient({ server });
    await client.mutate('mutation M($k: String!, $v: String!) { set(key: $k, value: $v) }', { k: 'a', v: '1' });
    const res = await client.query('query Q($k: String!) { get(key: $k) }', { k: 'a' });
    expect(res.data).toEqual({ get: '1' });
  });

  it('T-INT-G-003 subscription が 3 event を順次 emit', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { p: String } type Subscription { counter: Int }' },
      {
        Query: { p: () => 'ok' },
        Subscription: {
          async *counter() {
            yield 1;
            yield 2;
            yield 3;
          },
        },
      },
    );
    const handle = subscribeSubscription(server, 'subscription { counter }');
    const events: unknown[] = [];
    for await (const e of handle.events) {
      events.push(e);
    }
    expect(events).toHaveLength(3);
    expect((events[0] as { data?: { counter?: number } }).data?.counter).toBe(1);
  });

  it('T-INT-G-004 alias 経由 query で data key が alias 名になる', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { name: String }' },
      { Query: { name: () => 'kiwa' } },
    );
    const client = createGraphQLClient({ server });
    const res = await client.query('{ nickname: name }');
    expect(res.data).toEqual({ nickname: 'kiwa' });
  });

  it('T-INT-G-005 resolver 未登録の field で errors 返却', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { existing: String }' },
      { Query: { existing: () => 'ok' } },
    );
    const client = createGraphQLClient({ server });
    const res = await client.query('{ missing }');
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0]?.message).toContain('no resolver for field: missing');
  });

  it('T-INT-G-006 executeWithRetry: 1 attempt success', async () => {
    const { executeWithRetry } = await import('../../src/index.js');
    const server = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const result = await executeWithRetry(server, '{ hello }');
    expect(result.attempts).toBe(1);
    expect(result.data).toEqual({ hello: 'world' });
  });

  it('T-INT-G-007 executeBatch: 3 query 並列', async () => {
    const { executeBatch } = await import('../../src/index.js');
    const server = createGraphQLServer(
      { typeDefs: 'type Query { a: String b: String c: String }' },
      { Query: { a: () => '1', b: () => '2', c: () => '3' } },
    );
    const result = await executeBatch(server, [
      { query: '{ a }' },
      { query: '{ b }' },
      { query: '{ c }' },
    ]);
    expect(result.total).toBe(3);
    expect(result.succeeded).toBe(3);
  });

  it('T-INT-G-008 executeIdempotent: dedup', async () => {
    const { createIdempotencyCache, executeIdempotent } = await import('../../src/index.js');
    const server = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const cache = createIdempotencyCache();
    const first = await executeIdempotent(server, '{ hello }', {}, 'idem-1', cache);
    expect(first.cached).toBe(false);
    const second = await executeIdempotent(server, '{ hello }', {}, 'idem-1', cache);
    expect(second.cached).toBe(true);
  });

  it('T-INT-G-009 executeObservable: hook 発火', async () => {
    const { createHookRegistry, executeObservable } = await import('../../src/index.js');
    const server = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const hooks = createHookRegistry();
    const events: string[] = [];
    hooks.register('before-query', () => events.push('before'));
    hooks.register('after-query', () => events.push('after'));
    await executeObservable(server, '{ hello }', {}, hooks);
    expect(events).toEqual(['before', 'after']);
  });

  it('T-INT-G-010 circuit-breaker: state closed で normal execute', async () => {
    const { createCircuitBreaker } = await import('../../src/index.js');
    const server = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const breaker = createCircuitBreaker(server, { errorThreshold: 3, resetTimeoutMs: 100 });
    const result = await breaker.execute('{ hello }');
    expect(result.circuitState).toBe('closed');
    expect(result.data).toEqual({ hello: 'world' });
  });
});
