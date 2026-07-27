import { describe, expect, it } from 'vitest';
import {
  STATUS_CODES,
  composeInterceptors,
  createDeadlineContext,
  createGrpcServer,
  createMetadata,
  defineService,
  invokeBidi,
  invokeClientStream,
  invokeServerStream,
  invokeUnary,
  isDeadlineExceeded,
  type GrpcMetadata,
  type Interceptor,
} from '../src/index.js';

const server = createGrpcServer({ provider: 'grpc-js' });
server.addService(defineService('UserService', [
  {
    name: 'GetUser',
    type: 'unary',
    handler: async ({ id }: { id: string }, metadata: GrpcMetadata) => ({
      id,
      tenant: metadata?.find((entry) => entry.key === 'x-tenant')?.value,
    }),
  },
  {
    name: 'ListEvents',
    type: 'server-stream',
    handler: async function* ({ accountId }: { accountId: string }) {
      yield { id: 'event-1', accountId };
      yield { id: 'event-2', accountId };
    },
  },
  {
    name: 'Sum',
    type: 'client-stream',
    handler: async (requests: AsyncIterable<{ value: number }>) => {
      let total = 0;
      for await (const request of requests) total += request.value;
      return { total };
    },
  },
  {
    name: 'Echo',
    type: 'bidi',
    handler: async function* (requests: AsyncIterable<{ message: string }>) {
      for await (const request of requests) yield { echo: request.message };
    },
  },
]));

describe('library documentation gRPC recipes', () => {
  it('returns unary data with normalized metadata and unimplemented status', async () => {
    const result = await invokeUnary(server, 'UserService', 'GetUser', { id: 'user-42' }, createMetadata({ 'X-Tenant': 'acme' }));
    const missing = await invokeUnary(server, 'UserService', 'Missing', {});

    expect(result).toMatchObject({ ok: true, response: { id: 'user-42', tenant: 'acme' }, status: { code: STATUS_CODES.OK } });
    expect(missing).toMatchObject({ ok: false, status: { code: STATUS_CODES.UNIMPLEMENTED } });
  });

  it('collects server, client, and bidi streams in order', async () => {
    const events = await invokeServerStream(server, 'UserService', 'ListEvents', { accountId: 'account-1' });
    const total = await invokeClientStream(server, 'UserService', 'Sum', [{ value: 2 }, { value: 3 }]);
    const echo = await invokeBidi(server, 'UserService', 'Echo', [{ message: 'first' }, { message: 'second' }]);

    expect(events.responses).toEqual([{ id: 'event-1', accountId: 'account-1' }, { id: 'event-2', accountId: 'account-1' }]);
    expect(total).toMatchObject({ ok: true, response: { total: 5 } });
    expect(echo.responses).toEqual([{ echo: 'first' }, { echo: 'second' }]);
  });

  it('stops an unauthenticated or expired request before its handler', async () => {
    let now = 0;
    const deadline = createDeadlineContext(50, () => now);
    const guard: Interceptor = async (context, next) => {
      if (!context.metadata.find((entry) => entry.key === 'authorization')) {
        return { status: { code: STATUS_CODES.UNAUTHENTICATED, message: 'missing authorization' } };
      }
      if (isDeadlineExceeded(deadline)) {
        return { status: { code: STATUS_CODES.DEADLINE_EXCEEDED, message: 'deadline exceeded' } };
      }
      return next();
    };
    const invoke = composeInterceptors([guard]);
    const unauthenticated = await invoke(
      { service: 'UserService', method: 'GetUser', metadata: [], request: {} },
      async () => ({ response: { id: 'user-42' }, status: { code: STATUS_CODES.OK, message: '' } }),
    );
    now = 100;
    const expired = await invoke(
      { service: 'UserService', method: 'GetUser', metadata: createMetadata({ authorization: 'Bearer local-test' }), request: {} },
      async () => ({ response: { id: 'user-42' }, status: { code: STATUS_CODES.OK, message: '' } }),
    );

    expect(unauthenticated.status.code).toBe(STATUS_CODES.UNAUTHENTICATED);
    expect(expired.status.code).toBe(STATUS_CODES.DEADLINE_EXCEEDED);
  });
});
