/**
 * skill test — 5 primitive (createRNTestEnv / mockAsyncStorage / mockNavigation /
 * dispatchLinkingUrl / setPlatform) が全て export されて動作することを 5 case で assert。
 */
import { describe, expect, it } from 'vitest';
import {
  createRNTestEnv,
  mockAsyncStorage,
  mockNavigation,
  dispatchLinkingUrl,
  setPlatform,
  setDimensions,
} from '../../src/index.js';

describe('react-native skill assertions', () => {
  it('createRNTestEnv が 5 primitive を bundle した env を返す', () => {
    const env = createRNTestEnv({});
    expect(env.platform).toBeDefined();
    expect(env.dimensions).toBeDefined();
    expect(env.asyncStorage).toBeDefined();
    expect(env.navigation).toBeDefined();
    expect(env.linking).toBeDefined();
  });

  it('mockAsyncStorage の 7 API 全てが function として export', () => {
    const s = mockAsyncStorage();
    for (const m of ['getItem', 'setItem', 'removeItem', 'clear', 'getAllKeys', 'multiGet', 'multiSet'] as const) {
      expect(typeof s[m]).toBe('function');
    }
  });

  it('mockNavigation.addListener で focus / blur / state 3 event を購読可能', () => {
    const n = mockNavigation({ name: 'Home' });
    let count = 0;
    const off = n.addListener('focus', () => count++);
    n.navigate('Next');
    expect(count).toBe(1);
    off();
    n.navigate('Third');
    expect(count).toBe(1);
  });

  it('dispatchLinkingUrl が listener + received log 両方に反映', () => {
    const env = createRNTestEnv({});
    let received = '';
    env.linking.listeners.push((e) => {
      received = e.url;
    });
    dispatchLinkingUrl(env.linking, 'app://route');
    expect(received).toBe('app://route');
    expect(env.linking.received.length).toBe(1);
  });

  it('setPlatform / setDimensions で env state を実際に更新', () => {
    const env = createRNTestEnv({ platform: 'ios' });
    setPlatform(env.platform, { os: 'android', version: 34, isPad: true });
    setDimensions(env.dimensions, { window: { width: 1024, height: 768 } });
    expect(env.platform.os).toBe('android');
    expect(env.platform.version).toBe(34);
    expect(env.platform.isPad).toBe(true);
    expect(env.dimensions.window.width).toBe(1024);
  });
});
