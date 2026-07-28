/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createGraphQLServer,
  createGraphQLClient,
  subscribeSubscription,
} from '../../src/index.js';

const MODULE = 'graphql-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('graphql app scenario perf (real workload)', () => {
  it('3-layer perf: query_workflow / mutation_batch / subscription_error_handling', async () => {
    const users = new Map<string, { id: string; name: string; email: string }>([
      ['1', { id: '1', name: 'alice', email: 'a@x' }],
    ]);
    let counter = 1;

    const server = createGraphQLServer(
      {
        typeDefs: `
          type User { id: ID! name: String email: String }
          type Query { user(id: ID!): User users: [User] }
          type Mutation { createUser(name: String!, email: String!): User }
          type Subscription { userCreated: User }
        `,
      },
      {
        Query: {
          user: (args) => users.get(String(args.id)),
          users: () => Array.from(users.values()),
        },
        Mutation: {
          createUser: (args) => {
            counter += 1;
            const u = { id: String(counter), name: String(args.name), email: String(args.email) };
            users.set(u.id, u);
            return u;
          },
        },
        Subscription: {
          async *userCreated() {
            for (let i = 0; i < 3; i++) {
              yield { id: `sub-${i}`, name: `u${i}`, email: `u${i}@x` };
            }
          },
        },
      },
    );

    const client = createGraphQLClient({ server });

    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'query_workflow (10 client.query with variables)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await client.query('query GetUser($id: ID!) { user(id: $id) { id name email } }', { id: '1' });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'mutation_batch (5 createUser mutations)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await client.mutate(
                'mutation Create($name: String!, $email: String!) { createUser(name: $name, email: $email) { id name } }',
                { name: `user-${i}`, email: `user-${i}@x` },
              );
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'subscription_error_handling (5 subscribe + close + invalid)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const handle = subscribeSubscription(server, 'subscription { userCreated { id name } }');
              const it = handle.events[Symbol.asyncIterator]();
              await it.next();
              handle.close();
              try {
                subscribeSubscription(server, '{ hello }');
              } catch {
                /* handled - not a subscription operation */
              }
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
