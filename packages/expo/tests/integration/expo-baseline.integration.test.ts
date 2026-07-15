/**
 * integration test — expo domain の end-to-end workflow (onboarding / capture-and-upload /
 * navigation-and-notification) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import { createExpoTestEnv, dispatchNotification } from '../../src/index.js';

describe('expo integration — end-to-end workflow', () => {
  it('T-INT-X-001 onboarding = router.push + secureStore write + notification', async () => {
    const env = createExpoTestEnv();
    env.router.push('/onboarding');
    await env.secureStore.setItemAsync('userId', 'u-1');
    await env.secureStore.setItemAsync('token', 'tok-xyz');
    dispatchNotification(env, { title: 'Welcome', body: 'to kiwa' });
    env.router.replace('/home');
    expect(env.router.getCurrentPath()).toBe('/home');
    expect(await env.secureStore.getItemAsync('userId')).toBe('u-1');
    expect(env.scheduled.length).toBe(1);
  });

  it('T-INT-X-002 capture-and-upload = camera picture + fileSystem write + info verify', async () => {
    const env = createExpoTestEnv({ camera: { initialPermission: 'granted' } });
    const pic = await env.camera.takePictureAsync({ base64: true });
    await env.fileSystem.writeAsStringAsync('file:///mock/document/capture.b64', pic.base64!);
    const info = await env.fileSystem.getInfoAsync('file:///mock/document/capture.b64');
    expect(info.exists).toBe(true);
    expect(info.size).toBeGreaterThan(0);
  });

  it('T-INT-X-003 navigation history = push × 3 + back で stack 元に戻る', () => {
    const env = createExpoTestEnv({ router: { initialPath: '/root' } });
    env.router.push('/a');
    env.router.push('/b');
    env.router.push('/c');
    expect(env.router.getCurrentPath()).toBe('/c');
    env.router.back();
    env.router.back();
    expect(env.router.getCurrentPath()).toBe('/a');
    expect(env.router.getHistory().filter((h) => h.type === 'back').length).toBe(2);
  });

  it('T-INT-X-004 permission denied camera 経路 error handling', async () => {
    const env = createExpoTestEnv({ camera: { initialPermission: 'denied' } });
    await expect(env.camera.takePictureAsync()).rejects.toThrow(/permission not granted/);
    env.camera.setPermission('granted');
    const pic = await env.camera.takePictureAsync();
    expect(pic.uri).toMatch(/picture-1/);
  });

  it('T-INT-X-005 env.reset で全 SDK state が初期化', async () => {
    const env = createExpoTestEnv();
    env.router.push('/x');
    await env.secureStore.setItemAsync('k', 'v');
    await env.fileSystem.writeAsStringAsync('file:///mock/document/a.txt', 'hi');
    dispatchNotification(env, { title: 't', body: 'b' });
    env.reset();
    expect(env.router.getCurrentPath()).toBe('/');
    expect(await env.secureStore.getItemAsync('k')).toBeNull();
    expect(env.fileSystem.listUris().length).toBe(0);
    expect(env.scheduled.length).toBe(0);
  });
});
