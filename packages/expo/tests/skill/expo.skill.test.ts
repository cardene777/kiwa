/**
 * skill test — expo skill が主要 API 6 種 (createExpoTestEnv / mockExpoRouter /
 * mockSecureStore / dispatchNotification / mockFileSystem / mockCamera) を全て公開している
 * ことを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createExpoTestEnv,
  mockExpoRouter,
  mockSecureStore,
  dispatchNotification,
  mockFileSystem,
  mockCamera,
} from '../../src/index.js';

describe('expo skill assertions', () => {
  it('createExpoTestEnv が 5 SDK mock を集約した env を返す', () => {
    const env = createExpoTestEnv();
    expect(env.router).toBeDefined();
    expect(env.secureStore).toBeDefined();
    expect(env.fileSystem).toBeDefined();
    expect(env.camera).toBeDefined();
    expect(Array.isArray(env.scheduled)).toBe(true);
  });

  it('mockExpoRouter が initial path + history 記録に対応', () => {
    const r = mockExpoRouter({ initialPath: '/home' });
    r.push('/details', { id: '5' });
    r.back();
    expect(r.getCurrentPath()).toBe('/home');
    expect(r.getHistory().length).toBe(2);
    expect(r.getHistory()[0]!.type).toBe('push');
  });

  it('mockSecureStore が setItem / getItem / delete 3 経路を提供', async () => {
    const s = mockSecureStore();
    await s.setItemAsync('a', '1');
    expect(await s.getItemAsync('a')).toBe('1');
    await s.deleteItemAsync('a');
    expect(await s.getItemAsync('a')).toBeNull();
  });

  it('dispatchNotification が identifier + scheduled status を返す', () => {
    const env = createExpoTestEnv();
    const result = dispatchNotification(env, { title: 't', body: 'b' });
    expect(result.status).toBe('scheduled');
    expect(result.identifier.startsWith('notif-')).toBe(true);
  });

  it('mockCamera が permission 拒否時に takePicture を throw', async () => {
    const cam = mockCamera({ initialPermission: 'denied' });
    await expect(cam.takePictureAsync()).rejects.toThrow(/permission not granted/);
    cam.setPermission('granted');
    const pic = await cam.takePictureAsync();
    expect(pic.uri).toBeDefined();
  });

  it('mockFileSystem が documentDirectory + cacheDirectory を expose', () => {
    const fs = mockFileSystem();
    expect(fs.documentDirectory.startsWith('file://')).toBe(true);
    expect(fs.cacheDirectory.startsWith('file://')).toBe(true);
  });
});
