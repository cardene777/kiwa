/**
 * skill test — graphql skill が 5 主要 API (createGraphQLServer / executeQuery /
 * createGraphQLClient / parseGraphQLOperation / subscribeSubscription) を公開し、
 * 4 provider (apollo/yoga/urql/relay) で instantiate 可能なことを assertion。
 */
import { describe, expect, it } from 'vitest';
import {
  createGraphQLServer,
  createGraphQLClient,
  parseGraphQLOperation,
  subscribeSubscription,
} from '../../src/index.js';

describe('graphql skill assertions', () => {
  it('createGraphQLServer を 4 provider (apollo/yoga/urql/relay) で instantiate 可能', () => {
    for (const provider of ['apollo', 'yoga', 'urql', 'relay'] as const) {
      const server = createGraphQLServer(
        { typeDefs: 'type Query { p: String }' },
        { Query: { p: () => 'ok' } },
        { provider },
      );
      expect(server.provider).toBe(provider);
    }
  });

  it('parseGraphQLOperation が operation type と name を正しく抜き出す', () => {
    const q = parseGraphQLOperation('query GetHello { hello }');
    expect(q.type).toBe('query');
    expect(q.name).toBe('GetHello');
    const m = parseGraphQLOperation('mutation Set { setName(name: "kiwa") }');
    expect(m.type).toBe('mutation');
    expect(m.name).toBe('Set');
  });

  it('createGraphQLClient が server 経由で query / mutate を dispatch', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { p: String } type Mutation { s(v: String!): String }' },
      { Query: { p: () => 'ok' }, Mutation: { s: (a) => a.v } },
    );
    const client = createGraphQLClient({ server });
    const q = await client.query('{ p }');
    expect(q.data).toEqual({ p: 'ok' });
    const m = await client.mutate('mutation { s(v: "hi") }');
    expect(m.data).toEqual({ s: 'hi' });
    expect(client.listCalls().length).toBe(2);
  });

  it('subscribeSubscription が AsyncIterable で event を emit', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { p: String } type Subscription { tick: String }' },
      {
        Query: { p: () => 'ok' },
        Subscription: {
          async *tick() {
            yield 'a';
            yield 'b';
          },
        },
      },
    );
    const handle = subscribeSubscription(server, 'subscription { tick }');
    const events: unknown[] = [];
    for await (const e of handle.events) {
      events.push(e);
      if (events.length >= 2) break;
    }
    handle.close();
    expect(events.length).toBe(2);
  });

  it('server.listCalls が client の呼出を記録する', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { p: String }' },
      { Query: { p: () => 'ok' } },
    );
    await server.executeQuery('{ p }');
    await server.executeQuery('{ p }');
    expect(server.listCalls().length).toBe(2);
    server.clear();
    expect(server.listCalls().length).toBe(0);
  });
});
