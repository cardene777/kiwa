/**
 * integration test — env + 5 primitive を組合せた end-to-end workflow を 5 case で verify。
 */
import { describe, expect, it } from 'vitest';
import {
  createRNTestEnv,
  dispatchLinkingUrl,
  setPlatform,
  setDimensions,
} from '../../src/index.js';

describe('react-native integration — 5 primitive combined workflow', () => {
  it('T-INT-RN-001 login flow: navigate → storage set → goBack → getItem 経路', async () => {
    const env = createRNTestEnv({ initialRoute: { name: 'Login' } });
    env.navigation.navigate('Home');
    await env.asyncStorage.setItem('user', 'alice');
    env.navigation.goBack();
    expect(env.navigation.currentRoute().name).toBe('Login');
    expect(await env.asyncStorage.getItem('user')).toBe('alice');
  });

  it('T-INT-RN-002 deep link → route navigate integration', () => {
    const env = createRNTestEnv({});
    env.linking.listeners.push((e) => {
      const path = new URL(e.url).pathname.replace(/^\//, '');
      env.navigation.navigate(path, { source: 'deeplink' });
    });
    dispatchLinkingUrl(env.linking, 'app:///Detail');
    expect(env.navigation.currentRoute().name).toBe('Detail');
    expect(env.navigation.currentRoute().params).toEqual({ source: 'deeplink' });
  });

  it('T-INT-RN-003 platform 切替で dimension も同期更新', () => {
    const env = createRNTestEnv({ platform: 'ios' });
    setPlatform(env.platform, { os: 'android', version: 34 });
    setDimensions(env.dimensions, { window: { width: 412, height: 915, scale: 2.6 } });
    expect(env.platform.os).toBe('android');
    expect(env.dimensions.window.width).toBe(412);
    expect(env.dimensions.window.scale).toBe(2.6);
  });

  it('T-INT-RN-004 navigation history が navigate 連続で成長する', () => {
    const env = createRNTestEnv({ initialRoute: { name: 'A' } });
    env.navigation.navigate('B');
    env.navigation.navigate('C');
    expect(env.navigation.history().map((r) => r.name)).toEqual(['A', 'B', 'C']);
  });

  it('T-INT-RN-005 asyncStorage.clear で全 key が消える', async () => {
    const env = createRNTestEnv({});
    await env.asyncStorage.setItem('k1', 'v1');
    await env.asyncStorage.setItem('k2', 'v2');
    expect((await env.asyncStorage.getAllKeys()).length).toBe(2);
    await env.asyncStorage.clear();
    expect((await env.asyncStorage.getAllKeys()).length).toBe(0);
  });
});
