import { describe, expect, it } from 'vitest';
import {
  bindJsiRuntime,
  initTurboModules,
  invokeTurboMethod,
  registerTurboSpec,
  unregisterTurboModule,
} from '../../src/index.js';

describe('v1.52 turbo-modules semantics', () => {
  it('register → bind → invoke → unregister full cycle', () => {
    const s = initTurboModules({ target: 'ios', moduleName: 'CameraTurbo' });
    registerTurboSpec(s, ['takePhoto', 'startRecording']);
    bindJsiRuntime(s);
    invokeTurboMethod(s, 'takePhoto');
    invokeTurboMethod(s, 'startRecording');
    unregisterTurboModule(s);
    expect(s.state).toBe('unregistered');
    expect(s.methodInvocations).toBe(2);
    expect(s.jsiBound).toBe(false);
  });

  it('rejects bind before register', () => {
    const s = initTurboModules({ target: 'android', moduleName: 'X' });
    expect(() => bindJsiRuntime(s)).toThrow(/session is idle/);
  });

  it('rejects invoke before bind', () => {
    const s = initTurboModules({ target: 'ios', moduleName: 'X' });
    registerTurboSpec(s, ['a']);
    expect(() => invokeTurboMethod(s, 'a')).toThrow(/jsi not bound/);
  });

  it('rejects invoke of unregistered method', () => {
    const s = initTurboModules({ target: 'ios', moduleName: 'X' });
    registerTurboSpec(s, ['a']);
    bindJsiRuntime(s);
    expect(() => invokeTurboMethod(s, 'ghost')).toThrow(/not in registered/);
  });

  it('rejects empty inputs', () => {
    expect(() => initTurboModules({ target: 'ios', moduleName: '' })).toThrow(/moduleName/);
    const s = initTurboModules({ target: 'ios', moduleName: 'X' });
    expect(() => registerTurboSpec(s, [])).toThrow(/methods/);
  });
});
