import type { GraphQLServer, GraphQLExecutionResult, GraphQLVariables, GraphQLContext } from './server.js';

export interface GraphQLClientOptions {
  server: GraphQLServer;
  defaultContext?: GraphQLContext;
}

export interface GraphQLClientCall {
  method: 'query' | 'mutate' | 'subscribe';
  query: string;
  variables: GraphQLVariables;
  timestamp: number;
}

export interface GraphQLClient {
  provider: GraphQLServer['provider'];
  query: (query: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult>;
  mutate: (mutation: string, variables?: GraphQLVariables) => Promise<GraphQLExecutionResult>;
  listCalls: () => GraphQLClientCall[];
  clear: () => void;
}

/**
 * mock GraphQL client。 内部で server.executeQuery を叩くだけの thin wrapper だが、
 * client 側の呼出を独立に記録して urql / Relay 相当の caller inspection を可能にする。
 */
export function createGraphQLClient(options: GraphQLClientOptions): GraphQLClient {
  const { server, defaultContext = {} } = options;
  const calls: GraphQLClientCall[] = [];
  let counter = 0;
  const now = () => (counter += 1);

  return {
    provider: server.provider,
    async query(query, variables = {}) {
      calls.push({ method: 'query', query, variables, timestamp: now() });
      return server.executeQuery(query, variables, defaultContext);
    },
    async mutate(mutation, variables = {}) {
      calls.push({ method: 'mutate', query: mutation, variables, timestamp: now() });
      return server.executeQuery(mutation, variables, defaultContext);
    },
    listCalls: () => [...calls],
    clear: () => {
      calls.length = 0;
    },
  };
}
