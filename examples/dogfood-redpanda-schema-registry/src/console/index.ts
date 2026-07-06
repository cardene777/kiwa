/**
 * Redpanda Console admin API client — a small HTTP client that walks the
 * Console v2.x admin surface (`/api/subjects` + `/api/config/{subject}` +
 * `/api/schemas/ids/{id}` + `/api/health`). Both the mock adapter (which
 * uses a colocated deterministic fixture) and the real adapter (which hits
 * a live Console container / URL) share this shape so the fidelity harness
 * can compare the traces byte-for-byte on the endpoint list + status codes.
 *
 * The client keeps every network request behind an injectable `fetch`
 * implementation so unit tests can substitute a fake without touching
 * `globalThis.fetch`. The tiny surface (4 endpoints) is enough for the
 * v1.31-3 AC — the point is fidelity between the two adapters, not a
 * production Console SDK.
 */

/**
 * Minimal fetch-shape the console client depends on. Sub-set of the DOM
 * `fetch` signature so a test fake can be trivially typed.
 */
export type ConsoleFetch = (url: string, init?: { method?: string }) => Promise<{
  status: number;
  ok: boolean;
  json(): Promise<unknown>;
}>;

/** Endpoint hit record — 1 per HTTP call the client makes. */
export interface ConsoleEndpointHit {
  readonly path: string;
  readonly status: number;
  readonly ok: boolean;
}

export interface ConsoleAdminClientConfig {
  /** Base URL of the Console admin API (e.g. `http://localhost:8080`). */
  readonly baseUrl: string;
  /** Injected fetch — defaults to `globalThis.fetch`. */
  readonly fetchImpl?: ConsoleFetch;
}

export interface ConsoleAdminClient {
  readonly baseUrl: string;
  /** Return every endpoint hit this client made in insertion order. */
  readonly hits: () => readonly ConsoleEndpointHit[];
  listSubjects(): Promise<{ ok: boolean; subjects: readonly string[] }>;
  getSubjectConfig(subject: string): Promise<{ ok: boolean; compatibilityLevel: string | null }>;
  getSchemaById(id: number): Promise<{ ok: boolean; schema: string | null }>;
  health(): Promise<{ ok: boolean; status: string }>;
  reset(): void;
}

/**
 * Build a Console admin client. Every method records 1 hit + returns the
 * decoded body when possible. The Console v2.x admin API returns JSON
 * envelopes shaped like `{ subjects: [...] }` / `{ compatibilityLevel: ... }`
 * / `{ schema: '...' }` / `{ status: 'up' }`.
 */
export function createConsoleAdminClient(config: ConsoleAdminClientConfig): ConsoleAdminClient {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const fetchImpl: ConsoleFetch =
    config.fetchImpl ?? ((url, init) => globalThis.fetch(url, init as RequestInit));
  const hits: ConsoleEndpointHit[] = [];

  async function call<T>(path: string, decode: (body: unknown) => T): Promise<{ ok: boolean; value: T | null }> {
    const url = `${baseUrl}${path}`;
    try {
      const response = await fetchImpl(url);
      hits.push({ path, status: response.status, ok: response.ok });
      if (!response.ok) return { ok: false, value: null };
      const body = await response.json();
      return { ok: true, value: decode(body) };
    } catch {
      hits.push({ path, status: 0, ok: false });
      return { ok: false, value: null };
    }
  }

  return {
    baseUrl,
    hits: () => [...hits],
    async listSubjects() {
      const { ok, value } = await call('/api/subjects', (body) => {
        if (Array.isArray(body)) return body.map((s) => String(s));
        if (body && typeof body === 'object' && Array.isArray((body as { subjects?: unknown }).subjects)) {
          return (body as { subjects: unknown[] }).subjects.map((s) => String(s));
        }
        return [];
      });
      return { ok, subjects: value ?? [] };
    },
    async getSubjectConfig(subject: string) {
      const { ok, value } = await call(`/api/config/${encodeURIComponent(subject)}`, (body) => {
        if (body && typeof body === 'object' && 'compatibilityLevel' in body) {
          const v = (body as { compatibilityLevel: unknown }).compatibilityLevel;
          return typeof v === 'string' ? v : null;
        }
        return null;
      });
      return { ok, compatibilityLevel: value ?? null };
    },
    async getSchemaById(id: number) {
      const { ok, value } = await call(`/api/schemas/ids/${id}`, (body) => {
        if (body && typeof body === 'object' && 'schema' in body) {
          const v = (body as { schema: unknown }).schema;
          return typeof v === 'string' ? v : null;
        }
        return null;
      });
      return { ok, schema: value ?? null };
    },
    async health() {
      const { ok, value } = await call('/api/health', (body) => {
        if (body && typeof body === 'object' && 'status' in body) {
          const v = (body as { status: unknown }).status;
          return typeof v === 'string' ? v : 'unknown';
        }
        return 'unknown';
      });
      return { ok, status: value ?? 'unknown' };
    },
    reset() {
      hits.length = 0;
    },
  };
}

/**
 * Build a deterministic fake fetch that mirrors the Redpanda Console v2.x
 * admin API responses for a fixed set of subjects. Used by the mock adapter
 * so the mock/real fidelity comparison lines up byte-for-byte on the
 * endpoint list + status codes when the real container is not present.
 */
export function createFixtureFetch(input: {
  readonly subjects: readonly string[];
  readonly configBySubject: Record<string, string>;
  readonly schemaById: Record<number, string>;
  readonly healthStatus?: string;
}): ConsoleFetch {
  const healthStatus = input.healthStatus ?? 'up';
  return async (url) => {
    const path = new URL(url).pathname;
    if (path === '/api/subjects') {
      return jsonResponse(200, { subjects: [...input.subjects] });
    }
    if (path === '/api/health') {
      return jsonResponse(200, { status: healthStatus });
    }
    const configMatch = /^\/api\/config\/(.+)$/.exec(path);
    if (configMatch) {
      const subject = decodeURIComponent(configMatch[1] ?? '');
      const level = input.configBySubject[subject];
      if (level === undefined) return jsonResponse(404, { error: 'unknown subject' });
      return jsonResponse(200, { compatibilityLevel: level });
    }
    const schemaMatch = /^\/api\/schemas\/ids\/(\d+)$/.exec(path);
    if (schemaMatch) {
      const id = Number(schemaMatch[1]);
      const schema = input.schemaById[id];
      if (schema === undefined) return jsonResponse(404, { error: 'unknown schema id' });
      return jsonResponse(200, { schema });
    }
    return jsonResponse(404, { error: 'unknown path' });
  };
}

function jsonResponse(
  status: number,
  body: unknown,
): { status: number; ok: boolean; json(): Promise<unknown> } {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}
