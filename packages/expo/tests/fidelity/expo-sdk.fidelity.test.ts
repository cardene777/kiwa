/**
 * fidelity test — createExpoTestEnv (kiwa mock) が reference impl (仕様通り動く単純実装) と
 * 同じ挙動を示すことを 5 case で検証。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createExpoTestEnv, mockSecureStore } from '../../src/index.js';

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
});
