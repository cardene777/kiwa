import type { GrpcMetadata, GrpcServer } from './server.js';
import type { GrpcStatus } from './status.js';

export type UnaryHandler<Req = unknown, Res = unknown> = (req: Req, metadata?: GrpcMetadata) => Promise<Res> | Res;
export type ServerStreamHandler<Req = unknown, Res = unknown> = (req: Req, metadata?: GrpcMetadata) => AsyncIterable<Res>;
export type ClientStreamHandler<Req = unknown, Res = unknown> = (reqs: AsyncIterable<Req>, metadata?: GrpcMetadata) => Promise<Res> | Res;
export type BidiHandler<Req = unknown, Res = unknown> = (reqs: AsyncIterable<Req>, metadata?: GrpcMetadata) => AsyncIterable<Res>;

export interface UnaryResult<Res> {
  ok: boolean;
  response?: Res;
  status: GrpcStatus;
  trailingMetadata: GrpcMetadata;
}

export interface StreamResult<Res> {
  ok: boolean;
  responses: Res[];
  status: GrpcStatus;
  trailingMetadata: GrpcMetadata;
}

async function catchToStatus<T>(fn: () => Promise<T>): Promise<{ value?: T; status: GrpcStatus }> {
  try {
    const value = await fn();
    return { value, status: { code: 0, message: '' } };
  } catch (e) {
    const err = e as Error & { code?: number };
    return { status: { code: (err.code as 0) ?? 2, message: err.message } };
  }
}

export async function invokeUnary<Req, Res>(
  server: GrpcServer,
  serviceName: string,
  methodName: string,
  req: Req,
  metadata: GrpcMetadata = [],
): Promise<UnaryResult<Res>> {
  const method = server.getMethod(serviceName, methodName);
  if (!method || method.type !== 'unary') {
    return { ok: false, status: { code: 12, message: `method not found: ${serviceName}/${methodName}` }, trailingMetadata: [] };
  }
  const handler = method.handler as UnaryHandler<Req, Res>;
  const { value, status } = await catchToStatus(async () => handler(req, metadata));
  const result: UnaryResult<Res> = { ok: status.code === 0, status, trailingMetadata: [] };
  if (value !== undefined) result.response = value;
  return result;
}

export async function invokeServerStream<Req, Res>(
  server: GrpcServer,
  serviceName: string,
  methodName: string,
  req: Req,
  metadata: GrpcMetadata = [],
): Promise<StreamResult<Res>> {
  const method = server.getMethod(serviceName, methodName);
  if (!method || method.type !== 'server-stream') {
    return { ok: false, responses: [], status: { code: 12, message: `method not found: ${serviceName}/${methodName}` }, trailingMetadata: [] };
  }
  const handler = method.handler as ServerStreamHandler<Req, Res>;
  const responses: Res[] = [];
  const { status } = await catchToStatus(async () => {
    for await (const r of handler(req, metadata)) responses.push(r);
  });
  return { ok: status.code === 0, responses, status, trailingMetadata: [] };
}

export async function invokeClientStream<Req, Res>(
  server: GrpcServer,
  serviceName: string,
  methodName: string,
  reqs: Req[],
  metadata: GrpcMetadata = [],
): Promise<UnaryResult<Res>> {
  const method = server.getMethod(serviceName, methodName);
  if (!method || method.type !== 'client-stream') {
    return { ok: false, status: { code: 12, message: `method not found: ${serviceName}/${methodName}` }, trailingMetadata: [] };
  }
  const handler = method.handler as ClientStreamHandler<Req, Res>;
  async function* iter() {
    for (const r of reqs) yield r;
  }
  const { value, status } = await catchToStatus(async () => handler(iter(), metadata));
  const result: UnaryResult<Res> = { ok: status.code === 0, status, trailingMetadata: [] };
  if (value !== undefined) result.response = value;
  return result;
}

export async function invokeBidi<Req, Res>(
  server: GrpcServer,
  serviceName: string,
  methodName: string,
  reqs: Req[],
  metadata: GrpcMetadata = [],
): Promise<StreamResult<Res>> {
  const method = server.getMethod(serviceName, methodName);
  if (!method || method.type !== 'bidi') {
    return { ok: false, responses: [], status: { code: 12, message: `method not found: ${serviceName}/${methodName}` }, trailingMetadata: [] };
  }
  const handler = method.handler as BidiHandler<Req, Res>;
  async function* iter() {
    for (const r of reqs) yield r;
  }
  const responses: Res[] = [];
  const { status } = await catchToStatus(async () => {
    for await (const r of handler(iter(), metadata)) responses.push(r);
  });
  return { ok: status.code === 0, responses, status, trailingMetadata: [] };
}
