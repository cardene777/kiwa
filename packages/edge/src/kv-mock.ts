// Minimal Cloudflare KV namespace mock for kiwa edge tests.
//
// Implements the subset that production Workers code touches in practice:
//   - `get(key)` / `get(key, { type: 'json' | 'text' | 'arrayBuffer' })`
//   - `put(key, value, options?)` (TTL captured but ignored)
//   - `delete(key)`
//   - `list({ prefix?, limit? })` (no cursor pagination)
//
// Real Workers KV is eventually consistent and has a 1KB/key/24h propagation;
// kiwa's mock is strongly consistent because tests need determinism.

export interface KVNamespacePutOptions {
  readonly expirationTtl?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface KVNamespaceListOptions {
  readonly prefix?: string;
  readonly limit?: number;
}

export interface KVNamespaceListResult {
  readonly keys: ReadonlyArray<{ readonly name: string; readonly metadata?: Record<string, unknown> }>;
  readonly list_complete: true;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get<T>(key: string, type: 'json'): Promise<T | null>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
}

export interface KVMockEntry {
  readonly value: string;
  readonly metadata?: Record<string, unknown>;
}

export function createKvNamespace(initial: Record<string, string> = {}): KVNamespace {
  const store = new Map<string, KVMockEntry>();
  for (const [key, value] of Object.entries(initial)) {
    store.set(key, { value });
  }
  async function getImpl(key: string, type?: 'text' | 'json' | 'arrayBuffer'): Promise<unknown> {
    const entry = store.get(key);
    if (typeof entry === 'undefined') return null;
    if (type === 'json') return JSON.parse(entry.value) as unknown;
    if (type === 'arrayBuffer') {
      const enc = new TextEncoder().encode(entry.value);
      return enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength) as ArrayBuffer;
    }
    return entry.value;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const get = getImpl as any;
  return {
    get,
    async put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void> {
      const metadata = options?.metadata;
      store.set(key, typeof metadata === 'undefined' ? { value } : { value, metadata });
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
    async list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult> {
      const prefix = options?.prefix ?? '';
      const limit = options?.limit ?? 1000;
      const keys: Array<{ name: string; metadata?: Record<string, unknown> }> = [];
      for (const [name, entry] of store.entries()) {
        if (!name.startsWith(prefix)) continue;
        if (keys.length >= limit) break;
        keys.push(typeof entry.metadata === 'undefined' ? { name } : { name, metadata: entry.metadata });
      }
      return { keys, list_complete: true };
    },
  };
}
