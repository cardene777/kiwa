import { parseGraphQLOperation } from './parser.js';
import type { GraphQLServer, GraphQLVariables, GraphQLContext } from './server.js';

export interface SubscriptionEvent {
  data?: Record<string, unknown> | null;
  errors?: { message: string }[];
}

export interface SubscriptionHandle {
  events: AsyncIterable<SubscriptionEvent>;
  close: () => void;
}

/**
 * subscription mock。 real WebSocket transport は張らず、 resolver が返す AsyncIterable を
 * そのまま purely-in-process で iterate する。 close を呼ぶまで active。
 */
export function subscribeSubscription(
  server: GraphQLServer,
  query: string,
  variables: GraphQLVariables = {},
  context: GraphQLContext = {},
): SubscriptionHandle {
  const parsed = parseGraphQLOperation(query);
  if (parsed.type !== 'subscription') {
    throw new Error(`subscribeSubscription requires a subscription operation, got ${parsed.type}`);
  }
  const subResolvers = server.resolvers.Subscription;
  if (!subResolvers) {
    throw new Error('no Subscription resolvers registered');
  }
  const rootSel = parsed.selections[0];
  if (!rootSel) throw new Error('subscription requires at least 1 selection');
  const resolver = subResolvers[rootSel.name];
  if (!resolver) throw new Error(`no subscription resolver for ${rootSel.name}`);

  let closed = false;
  const args = resolveArgs(rootSel.arguments, variables);
  const source = resolver(args, context);

  async function* iterate(): AsyncIterable<SubscriptionEvent> {
    try {
      for await (const value of source) {
        if (closed) return;
        const data: Record<string, unknown> = {};
        data[rootSel!.alias ?? rootSel!.name] = value;
        yield { data };
      }
    } catch (e) {
      yield { errors: [{ message: (e as Error).message }] };
    }
  }

  return {
    events: iterate(),
    close: () => {
      closed = true;
    },
  };
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
