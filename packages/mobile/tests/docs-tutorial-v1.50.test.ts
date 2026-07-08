/**
 * v1.50-3 docs 補強 — tutorial 110 code snippet 検証。
 * 28 milestone 連続 snippet validation streak = v1.23 → v1.50。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import {
  applyMetroHmr,
  completeExpoBuild,
  completeMetroBundle,
  invokeNativeModule,
  loadExpoBuildConfig,
  mountReactNativeComponent,
  receivePushNotification,
  recognizeGesture,
  resolveDeepLink,
  resolveMetroModule,
  startMetroBundle,
  unmountReactNativeComponent,
} from '../src/index.js';

describe('tutorial 110 — React Native lifecycle snippet', () => {
  it('mount → invoke → gesture → unmount', () => {
    const s = mountReactNativeComponent({ target: 'ios', componentId: 'Home' });
    invokeNativeModule(s, 'CameraModule');
    recognizeGesture(s, 'tap');
    unmountReactNativeComponent(s);
    expect(s.state).toBe('unmounted');
    expect(s.nativeModuleInvocations).toBe(1);
  });
});

describe('tutorial 110 — Expo build flow snippet', () => {
  it('load config → deep link → push → complete build', () => {
    const s = loadExpoBuildConfig({ target: 'android', appSlug: 'myapp', configHash: 'abc' });
    resolveDeepLink(s, { scheme: 'myapp', path: 'user/42' });
    receivePushNotification(s, { notificationId: 'n1', category: 'chat' });
    completeExpoBuild(s);
    expect(s.state).toBe('build-completed');
  });
});

describe('tutorial 110 — Metro bundle flow snippet', () => {
  it('start → resolve → hmr → complete', () => {
    const s = startMetroBundle({ target: 'ios', bundleId: 'main' });
    resolveMetroModule(s, 'App.tsx');
    applyMetroHmr(s, 'App.tsx');
    completeMetroBundle(s);
    expect(s.state).toBe('completed');
  });
});
