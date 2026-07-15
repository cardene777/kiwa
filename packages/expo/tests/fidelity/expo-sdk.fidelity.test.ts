/**
 * fidelity test — createExpoTestEnv (kiwa mock) が reference impl (仕様通り動く単純実装) と
 * 同じ挙動を示すことを 5 case で検証。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createExpoTestEnv,
  mockSecureStore,
  mockEASUpdate,
  mockModal,
  retryWithBackoff,
  batchAsync,
  createRateLimiter,
} from '../../src/index.js';

function referenceSecureStore() {
  const s = new Map<string, string>();
  return {
    async set(k: string, v: string) { s.set(k, v); },
    async get(k: string) { return s.get(k) ?? null; },
    async del(k: string) { s.delete(k); },
  };
}

describe('expo SDK fidelity vs reference impl', () => {
  it('SecureStore get/set = reference と一致', async () => {
    const mock = mockSecureStore({});
    const real = referenceSecureStore();
    await mock.setItemAsync('k', 'v');
    await real.set('k', 'v');
    const result = await assertFidelity({
      mockFn: async (k: string) => mock.getItemAsync(k),
      realFn: async (k: string) => real.get(k),
      cases: [
        { name: 'existing key', args: ['k'] },
        { name: 'missing key', args: ['missing'] },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('Router push で currentPath + segments が更新', () => {
    const env = createExpoTestEnv();
    env.router.push('/user/42/settings');
    expect(env.router.getCurrentPath()).toBe('/user/42/settings');
    expect(env.router.getSegments()).toEqual(['user', '42', 'settings']);
  });

  it('FileSystem write → read で content 一致', async () => {
    const env = createExpoTestEnv();
    await env.fileSystem.writeAsStringAsync('file:///mock/document/a.txt', 'hello');
    const content = await env.fileSystem.readAsStringAsync('file:///mock/document/a.txt');
    expect(content).toBe('hello');
    const info = await env.fileSystem.getInfoAsync('file:///mock/document/a.txt');
    expect(info.exists).toBe(true);
    expect(info.size).toBe(5);
  });

  it('Camera permission=granted で picture 撮影可能', async () => {
    const env = createExpoTestEnv({ camera: { initialPermission: 'granted' } });
    const pic = await env.camera.takePictureAsync({ base64: true });
    expect(pic.uri).toMatch(/picture-1\.jpg$/);
    expect(pic.width).toBe(1920);
    expect(pic.base64).toBeDefined();
    expect(env.camera.getCapturedPictures().length).toBe(1);
  });

  it('Notification dispatch で scheduled list に record + identifier 発行', () => {
    const env = createExpoTestEnv();
    const r = env.scheduled.length;
    const result = { ...{}, ...(function () {
      const { dispatchNotification } = require('../../src/notifications.js');
      return dispatchNotification(env, { title: 't', body: 'b', data: { x: 1 } });
    })() };
    expect(result.status).toBe('scheduled');
    expect(env.scheduled.length).toBe(r + 1);
    expect(env.scheduled[env.scheduled.length - 1]!.payload.title).toBe('t');
  });

  // v2.1 追加 5 case
  it('v2.1 EAS Update mock で publishUpdate → checkForUpdateAsync', async () => {
    const eas = mockEASUpdate();
    eas.publishUpdate({ id: 'u1', runtimeVersion: '1.0.0', createdAt: 0, isEnabled: true, channel: 'production' });
    const check = await eas.checkForUpdateAsync();
    expect(check.isAvailable).toBe(true);
    expect(check.manifest?.id).toBe('u1');
  });

  it('v2.1 Modal mock で present → dismiss で isVisible 遷移', () => {
    const m = mockModal();
    expect(m.isVisible()).toBe(false);
    m.present({ animation: 'slide' });
    expect(m.isVisible()).toBe(true);
    m.dismiss();
    expect(m.isVisible()).toBe(false);
    expect(m.history().length).toBe(2);
  });

  it('v2.1 retryWithBackoff = 3 attempt で成功', async () => {
    let attempts = 0;
    const r = await retryWithBackoff(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(3);
  });

  it('v2.1 batchAsync = 5 handler 並列', async () => {
    const r = await batchAsync(Array.from({ length: 5 }, (_, i) => async () => i));
    expect(r.successCount).toBe(5);
  });

  it('v2.1 rate limiter burst 3', () => {
    const rl = createRateLimiter(1, 3);
    const results = [rl.tryAcquire(), rl.tryAcquire(), rl.tryAcquire()];
    expect(results.every((v) => v)).toBe(true);
  });
});
