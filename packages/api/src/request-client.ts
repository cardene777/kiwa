import type { ApiRequestClient, ApiResponseSnapshot } from './types.js';

function snapshotHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function buildBody(body: unknown): { body: BodyInit | undefined; headers: Record<string, string> } {
  if (body === undefined || body === null) {
    return { body: undefined, headers: {} };
  }
  if (typeof body === 'string' || body instanceof ArrayBuffer || body instanceof Uint8Array) {
    return { body: body as BodyInit, headers: {} };
  }
  return {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  };
}

export interface RequestClientOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  fetcher?: typeof fetch;
}

export function createRequestClient(opts: RequestClientOptions): ApiRequestClient {
  const fetcher = opts.fetcher ?? globalThis.fetch;
  const baseUrl = opts.baseUrl.replace(/\/$/, '');

  async function send(
    method: string,
    path: string,
    body: unknown,
    init?: RequestInit,
  ): Promise<ApiResponseSnapshot> {
    const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const { body: encodedBody, headers: bodyHeaders } = buildBody(body);
    const headers = {
      ...(opts.defaultHeaders ?? {}),
      ...bodyHeaders,
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    };
    const finalInit: RequestInit = {
      ...(init ?? {}),
      method,
      headers,
    };
    if (encodedBody !== undefined) {
      finalInit.body = encodedBody;
    }
    const res = await fetcher(url, finalInit);
    const bodyText = await res.text();
    return {
      status: res.status,
      headers: snapshotHeaders(res.headers),
      bodyText,
      json: <T = unknown>() => JSON.parse(bodyText) as T,
    };
  }

  return {
    get: (path, init) => send('GET', path, undefined, init),
    post: (path, body, init) => send('POST', path, body, init),
    put: (path, body, init) => send('PUT', path, body, init),
    patch: (path, body, init) => send('PATCH', path, body, init),
    delete: (path, init) => send('DELETE', path, undefined, init),
  };
}
