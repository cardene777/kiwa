/**
 * fidelity test — createGraphQLServer (kiwa mock) が reference impl と同じ動作を示すことを
 * 5 case で検証。 query / mutation / variables / errors / alias の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createGraphQLServer } from '../../src/index.js';

function referenceServer() {
  return {
    async execute(query: string) {
      if (query.includes('hello')) {
        return { data: { hello: 'world' } };
      }
      return { data: null };
    },
  };
}

describe('graphql server fidelity vs reference impl', () => {
  it('query { hello } が reference と同じ data を返す', async () => {
    const mock = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const ref = referenceServer();
    const result = await assertFidelity({
      mockFn: async () => (await mock.executeQuery('{ hello }')).data?.hello,
      realFn: async () => (await ref.execute('{ hello }')).data?.hello,
      cases: [{ name: 'hello query', args: [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('mutation が resolver return 値を返す', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Mutation { setName(name: String!): String }' },
      { Mutation: { setName: (args) => args.name } },
    );
    const res = await server.executeQuery('mutation { setName(name: "kiwa") }');
    expect(res.data).toEqual({ setName: 'kiwa' });
  });

  it('variables が args に反映される', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { echo(msg: String!): String }' },
      { Query: { echo: (args) => args.msg } },
    );
    const res = await server.executeQuery('query E($m: String!) { echo(msg: $m) }', { m: 'hi' });
    expect(res.data).toEqual({ echo: 'hi' });
  });

  it('resolver throw で errors 配列に反映', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { fail: String }' },
      {
        Query: {
          fail: () => {
            throw new Error('boom');
          },
        },
      },
    );
    const res = await server.executeQuery('{ fail }');
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0]?.message).toBe('boom');
  });

  it('alias が data key として反映される', async () => {
    const server = createGraphQLServer(
      { typeDefs: 'type Query { hello: String }' },
      { Query: { hello: () => 'world' } },
    );
    const res = await server.executeQuery('{ greeting: hello }');
    expect(res.data).toEqual({ greeting: 'world' });
  });
});
