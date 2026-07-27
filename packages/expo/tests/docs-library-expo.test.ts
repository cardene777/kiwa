import { expect, it } from 'vitest';
import { createExpoTestEnv, dispatchNotification } from '../src/index.js';

it('documents session routing and reset of secure state', async () => {
  const env = createExpoTestEnv({
    router: { initialPath: '/home' }, secureStore: { initial: { theme: 'dark' } },
  });
  await env.secureStore.setItemAsync('session', 'token-1');
  env.router.push('/orders/5', { source: 'login' });
  expect(await env.secureStore.getItemAsync('session')).toBe('token-1');
  expect(env.router.getHistory()).toEqual([{ type: 'push', path: '/orders/5', params: { source: 'login' } }]);
  env.reset();
  expect(await env.secureStore.getItemAsync('session')).toBeNull();
  expect(await env.secureStore.getItemAsync('theme')).toBeNull();
  expect(env.router.getCurrentPath()).toBe('/home');
});

it('documents notification navigation, permission, captured data, and cleanup', async () => {
  const env = createExpoTestEnv({ nowFn: () => 1_000 });
  expect(dispatchNotification(env, {
    title: '注文を発送しました', body: '配送状況を確認できます', data: { path: '/orders/5' }, trigger: { seconds: 30 },
  })).toEqual({ identifier: 'notif-1', status: 'scheduled' });
  env.router.push(String(env.scheduled[0]?.payload.data?.path));
  expect(env.router.getCurrentPath()).toBe('/orders/5');
  await expect(env.camera.takePictureAsync()).rejects.toThrow('Camera permission not granted');
  await env.camera.requestCameraPermissionsAsync();
  const picture = await env.camera.takePictureAsync({ base64: true, exif: true });
  await env.fileSystem.writeAsStringAsync('file:///mock/document/receipt.b64', picture.base64!);
  expect(await env.fileSystem.getInfoAsync('file:///mock/document/receipt.b64')).toMatchObject({
    exists: true, size: picture.base64!.length,
  });
  env.reset();
  expect(env.fileSystem.listUris()).toEqual([]);
});
