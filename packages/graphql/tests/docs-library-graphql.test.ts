import { describe, expect, it } from 'vitest';
import {
  createGraphQLClient,
  createGraphQLServer,
  subscribeSubscription,
} from '../src/index.js';

describe('library documentation GraphQL recipes', () => {
  it('returns query data and puts a resolver failure in errors', async () => {
    const healthy = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
      { provider: 'apollo' },
    );
    const broken = createGraphQLServer(
      { typeDefs: 'type Query { profile: String }' },
      { Query: { profile: () => { throw new Error('profile unavailable'); } } },
    );

    expect(await healthy.executeQuery('{ hello }')).toEqual({ data: { hello: 'world' } });
    expect(await broken.executeQuery('{ profile }')).toEqual({
      data: {},
      errors: [{ message: 'profile unavailable', path: ['profile'] }],
    });
  });

  it('passes variables and context, keeps partial data, and records client calls', async () => {
    const users = new Map<string, { id: string; name: string }>([['u-1', { id: 'u-1', name: 'Ada' }]]);
    const server = createGraphQLServer(
      { typeDefs: 'type Query { user(id: ID!): User healthy: String broken: String } type Mutation { rename(id: ID!, name: String!): User } type User { id: ID! name: String! }' },
      {
        Query: {
          user: ({ id }, context) => {
            if (context.actorId !== 'admin-1') throw new Error('not allowed');
            return users.get(String(id)) ?? null;
          },
          healthy: () => 'ok',
          broken: () => { throw new Error('upstream unavailable'); },
        },
        Mutation: { rename: ({ id, name }) => ({ id: String(id), name: String(name) }) },
      },
      { provider: 'apollo' },
    );
    const client = createGraphQLClient({ server });

    expect(await server.executeQuery('query GetUser($id: ID!) { user(id: $id) { id name } }', { id: 'u-1' }, { actorId: 'admin-1' }))
      .toEqual({ data: { user: { id: 'u-1', name: 'Ada' } } });
    expect(await server.executeQuery('{ healthy broken }')).toEqual({
      data: { healthy: 'ok' },
      errors: [{ message: 'upstream unavailable', path: ['broken'] }],
    });
    expect(await client.mutate('mutation Rename($id: ID!, $name: String!) { rename(id: $id, name: $name) { id name } }', { id: 'u-1', name: 'Grace' }))
      .toEqual({ data: { rename: { id: 'u-1', name: 'Grace' } } });
    expect(client.listCalls().map((call) => call.method)).toEqual(['mutate']);
  });

  it('reads a finite subscription and closes its handle', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Subscription { messageAdded: Message } type Message { id: ID! text: String! }' },
      { Subscription: { async *messageAdded() { yield { id: 'm-1', text: 'hello' }; } } },
    );
    const handle = subscribeSubscription(server, 'subscription { messageAdded { id text } }');
    const events: unknown[] = [];

    for await (const event of handle.events) events.push(event);
    handle.close();

    expect(events).toEqual([{ data: { messageAdded: { id: 'm-1', text: 'hello' } } }]);
  });
});
