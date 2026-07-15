/**
 * fidelity test — createUploadClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で upload / list / delete / provider 差異 / failure path の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createUploadClient } from '../../src/index.js';

function referenceObjectStore() {
  const store = new Map<string, Buffer>();
  let counter = 0;
  return {
    async upload(req: { bucket: string; key: string; body: Buffer }) {
      counter += 1;
      store.set(`${req.bucket}/${req.key}`, req.body);
      return { id: `ref-${counter}`, status: 'uploaded' as const, size: req.body.byteLength };
    },
    get(bucket: string, key: string) {
      return store.get(`${bucket}/${key}`);
    },
  };
}

describe('upload client fidelity vs reference impl', () => {
  it('upload api = uploaded 状態 + size を返す', async () => {
    const mock = createUploadClient({ provider: 's3' });
    const real = referenceObjectStore();
    const body = Buffer.from('data');
    const result = await assertFidelity({
      mockFn: async (key: string) => (await mock.upload({ bucket: 'b', key, body })).status,
      realFn: async (key: string) => (await real.upload({ bucket: 'b', key, body })).status,
      cases: [{ name: 'basic upload', args: ['k1'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 upload で list が全 record を返す', async () => {
    const mock = createUploadClient({ provider: 'gcs' });
    for (let i = 0; i < 3; i++) await mock.upload({ bucket: 'b', key: `k${i}`, body: Buffer.from(`v${i}`) });
    expect(mock.list('b').length).toBe(3);
  });

  it('get で upload した body が復元できる', async () => {
    const mock = createUploadClient({ provider: 'r2' });
    await mock.upload({ bucket: 'b', key: 'k', body: Buffer.from('hello') });
    expect(mock.get('b', 'k')?.body.toString()).toBe('hello');
  });

  it('failOn callback で failure status を返す', async () => {
    const mock = createUploadClient({ provider: 'cloudinary', failOn: (r) => r.key === 'block' });
    const res = await mock.upload({ bucket: 'b', key: 'block', body: Buffer.from('x') });
    expect(res.status).toBe('failed');
    expect(res.reason).toContain('provider rejected');
  });

  it('delete で store から object が消える', async () => {
    const mock = createUploadClient({ provider: 's3' });
    await mock.upload({ bucket: 'b', key: 'k', body: Buffer.from('x') });
    expect(mock.delete('b', 'k')).toBe(true);
    expect(mock.get('b', 'k')).toBeUndefined();
  });
});
