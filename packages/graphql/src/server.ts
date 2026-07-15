import { parseGraphQLOperation } from './parser.js';

export type GraphQLProvider = 'apollo' | 'yoga' | 'urql' | 'relay';

export type GraphQLVariables = Record<string, string | number | boolean | null>;
export type GraphQLContext = Record<string, unknown>;

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLExecutionResult {
  data?: Record<string, unknown> | null;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}

export type GraphQLResolverFn = (
  args: Record<string, unknown>,
  context: GraphQLContext,
) => unknown | Promise<unknown>;

export interface GraphQLResolvers {
  Query?: Record<string, GraphQLResolverFn>;
  Mutation?: Record<string, GraphQLResolverFn>;
  Subscription?: Record<string, (args: Record<string, unknown>, context: GraphQLContext) => AsyncIterable<unknown>>;
}

export interface GraphQLSchemaDef {
  typeDefs: string;
}

export interface GraphQLServerCall {
  operationType: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  query: string;
  variables: GraphQLVariables;
  status: 'ok' | 'error';
  timestamp: number;
}

export interface GraphQLServer {
  provider: GraphQLProvider;
  schema: GraphQLSchemaDef;
  resolvers: GraphQLResolvers;
  executeQuery: (
    query: string,
    variables?: GraphQLVariables,
    context?: GraphQLContext,
  ) => Promise<GraphQLExecutionResult>;
  listCalls: () => GraphQLServerCall[];
  clear: () => void;
}

export interface CreateGraphQLServerOptions {
  provider?: GraphQLProvider;
  now?: () => number;
}

/**
 * schema + resolvers を受け取って mock GraphQL server を作る。 executeQuery で query / mutation
 * を dispatch し、 対応する resolver を呼出、 結果を data / errors 形式で返す。
 * subscription は subscribeSubscription 経由で呼出 (別 module)。
 */
export function createGraphQLServer(
  schema: GraphQLSchemaDef,
  resolvers: GraphQLResolvers,
  options: CreateGraphQLServerOptions = {},
): GraphQLServer {
  const provider = options.provider ?? 'apollo';
  const now = options.now ?? (() => 0);
  const calls: GraphQLServerCall[] = [];

  const server: GraphQLServer = {
    provider,
    schema,
    resolvers,
    async executeQuery(query, variables = {}, context = {}) {
      return executeQuery(server, query, variables, context, (call) => calls.push(call), now);
    },
    listCalls: () => [...calls],
    clear: () => {
      calls.length = 0;
    },
  };

  return server;
}

/**
 * mock server 経由で GraphQL query / mutation を実行する。 parser で operation を分解し、
 * 対応する resolver を selection ごとに呼出、 data を組み立てる。 subscription は
 * subscribeSubscription 経由で呼出。
 */
export async function executeQuery(
  server: GraphQLServer,
  query: string,
  variables: GraphQLVariables = {},
  context: GraphQLContext = {},
  onCall?: (call: GraphQLServerCall) => void,
  now: () => number = () => 0,
): Promise<GraphQLExecutionResult> {
  let parsed;
  try {
    parsed = parseGraphQLOperation(query);
  } catch (e) {
    return { errors: [{ message: `parse error: ${(e as Error).message}` }] };
  }

  const call: GraphQLServerCall = {
    operationType: parsed.type,
    query,
    variables,
    status: 'ok',
    timestamp: now(),
  };
  if (parsed.name !== undefined) call.operationName = parsed.name;

  if (parsed.type === 'subscription') {
    call.status = 'error';
    onCall?.(call);
    return { errors: [{ message: 'subscription must be executed via subscribeSubscription' }] };
  }

  const resolverBucket =
    parsed.type === 'query' ? server.resolvers.Query : server.resolvers.Mutation;
  if (!resolverBucket) {
    call.status = 'error';
    onCall?.(call);
    return { errors: [{ message: `no resolvers registered for ${parsed.type}` }] };
  }

  const data: Record<string, unknown> = {};
  const errors: GraphQLError[] = [];
  for (const sel of parsed.selections) {
    const resolver = resolverBucket[sel.name];
    if (!resolver) {
      errors.push({ message: `no resolver for field: ${sel.name}`, path: [sel.name] });
      continue;
    }
    const args = resolveArgs(sel.arguments, variables);
    try {
      const value = await resolver(args, context);
      data[sel.alias ?? sel.name] = pickSelections(value, sel.selections);
    } catch (e) {
      errors.push({ message: (e as Error).message, path: [sel.alias ?? sel.name] });
    }
  }

  if (errors.length > 0) call.status = 'error';
  onCall?.(call);

  const result: GraphQLExecutionResult = { data };
  if (errors.length > 0) result.errors = errors;
  return result;
}

function resolveArgs(
  args: Record<string, string | number | boolean | null>,
  variables: GraphQLVariables,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === 'string' && v.startsWith('$')) {
      resolved[k] = variables[v.slice(1)];
    } else {
      resolved[k] = v;
    }
  }
  return resolved;
}

function pickSelections(value: unknown, selections: SelectionFieldLike[]): unknown {
  if (selections.length === 0) return value;
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => pickSelections(v, selections));
  if (typeof value !== 'object') return value;
  const picked: Record<string, unknown> = {};
  for (const sel of selections) {
    const sourceKey = sel.name;
    const outKey = sel.alias ?? sel.name;
    picked[outKey] = pickSelections((value as Record<string, unknown>)[sourceKey], sel.selections);
  }
  return picked;
}

interface SelectionFieldLike {
  name: string;
  alias?: string;
  selections: SelectionFieldLike[];
}
