/**
 * v1.51-3 docs 補強 — tutorial 111 code snippet 検証。
 * 29 milestone 連続 snippet validation streak = v1.23 → v1.51。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import {
  assertMobileRealDriverAvailable,
  challengeBiometric,
  completeReanimatedAnimation,
  executeWorklet,
  initAsyncStorage,
  initNavigation,
  initReanimated,
  initSecureStorage,
  navigateDeepLink,
  openNavigationModal,
  pushNavigationStack,
  readMobileRealDriverEnv,
  removeCredential,
  setAsyncStorageItem,
  startReanimatedAnimation,
  storeCredential,
  switchNavigationTab,
  updateSharedValue,
} from '../src/index.js';

describe('tutorial 111 — Navigation flow snippet', () => {
  it('composes navigation flow', () => {
    const s = initNavigation({ target: 'ios', navigatorId: 'root' });
    pushNavigationStack(s, 'HomeScreen');
    switchNavigationTab(s, 'Search');
    openNavigationModal(s, 'FilterModal');
    navigateDeepLink(s, 'myapp://user/1');
    expect(s.state).toBe('deep-linked');
  });
});

describe('tutorial 111 — Reanimated snippet', () => {
  it('shared value + worklet + animate', () => {
    const s = initReanimated({ target: 'android', animationId: 'fade' });
    updateSharedValue(s, { name: 'opacity', value: 0 });
    executeWorklet(s, 'interpolate');
    startReanimatedAnimation(s, { durationMs: 300, easing: 'ease' });
    completeReanimatedAnimation(s);
    expect(s.state).toBe('completed');
  });
});

describe('tutorial 111 — Storage snippet', () => {
  it('AsyncStorage set + Secure store + biometric', () => {
    const as = initAsyncStorage({ target: 'ios', storeId: 'app' });
    setAsyncStorageItem(as, { key: 'theme', value: 'dark' });
    const ss = initSecureStorage({ target: 'ios', vaultId: 'vault' });
    storeCredential(ss, { key: 'token', encryptedValue: 'enc:xxx', requireBiometric: true });
    challengeBiometric(ss, { method: 'face-id', success: true });
    removeCredential(ss, 'token');
    expect(ss.state).toBe('removed');
    expect(as.items.get('theme')).toBe('dark');
  });
});

describe('tutorial 111 — Real driver env-gate snippet', () => {
  it('rejects without env', () => {
    const savedMode = process.env.KIWA_MOBILE_MODE;
    delete process.env.KIWA_MOBILE_MODE;
    const env = readMobileRealDriverEnv();
    expect(() => assertMobileRealDriverAvailable('navigation', env)).toThrow(/KIWA_MOBILE_MODE/);
    if (savedMode !== undefined) process.env.KIWA_MOBILE_MODE = savedMode;
  });
});
