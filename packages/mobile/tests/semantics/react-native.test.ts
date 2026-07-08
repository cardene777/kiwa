import { describe, expect, it } from 'vitest';
import {
  invokeNativeModule,
  mountReactNativeComponent,
  recognizeGesture,
  unmountReactNativeComponent,
} from '../../src/index.js';

describe('react-native axis semantics', () => {
  it('mount → invoke → gesture → unmount', () => {
    const s = mountReactNativeComponent({ target: 'ios', componentId: 'Home' });
    invokeNativeModule(s, 'CameraModule');
    recognizeGesture(s, 'tap');
    unmountReactNativeComponent(s);
    expect(s.state).toBe('unmounted');
    expect(s.nativeModuleInvocations).toBe(1);
    expect(s.gesturesRecognized).toContain('tap');
  });

  it('rejects invoke after unmount', () => {
    const s = mountReactNativeComponent({ target: 'android', componentId: 'X' });
    unmountReactNativeComponent(s);
    expect(() => invokeNativeModule(s, 'X')).toThrow(/unmounted/);
  });

  it('rejects gesture after unmount', () => {
    const s = mountReactNativeComponent({ target: 'web', componentId: 'X' });
    unmountReactNativeComponent(s);
    expect(() => recognizeGesture(s, 'pan')).toThrow(/unmounted/);
  });

  it('rejects double unmount', () => {
    const s = mountReactNativeComponent({ target: 'ios', componentId: 'X' });
    unmountReactNativeComponent(s);
    expect(() => unmountReactNativeComponent(s)).toThrow(/already unmounted/);
  });

  it('rejects empty componentId', () => {
    expect(() => mountReactNativeComponent({ target: 'ios', componentId: '' })).toThrow(/componentId/);
  });

  it('provider dialect maps to ios native', () => {
    const s = mountReactNativeComponent({ target: 'ios', componentId: 'X' });
    expect(s.history[0]?.providerEvent).toContain('ios');
  });

  it('provider dialect maps to android', () => {
    const s = mountReactNativeComponent({ target: 'android', componentId: 'X' });
    expect(s.history[0]?.providerEvent).toContain('android');
  });
});
