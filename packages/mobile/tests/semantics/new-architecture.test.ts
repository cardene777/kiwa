import { describe, expect, it } from 'vitest';
import {
  bridgeLegacyModule,
  enableConcurrentReact,
  initNewArchitecture,
  markNewArchReady,
  startNewArchInit,
} from '../../src/index.js';

describe('v1.52 new-architecture semantics', () => {
  it('init → concurrent → interop → ready full cycle', () => {
    const s = initNewArchitecture({ target: 'ios', appName: 'MyApp' });
    startNewArchInit(s);
    enableConcurrentReact(s);
    bridgeLegacyModule(s, 'LegacyAudioModule');
    bridgeLegacyModule(s, 'LegacyPushModule');
    markNewArchReady(s);
    expect(s.state).toBe('ready');
    expect(s.concurrentEnabled).toBe(true);
    expect(s.bridgedLegacyModules).toHaveLength(2);
  });

  it('rejects concurrent before init', () => {
    const s = initNewArchitecture({ target: 'android', appName: 'X' });
    expect(() => enableConcurrentReact(s)).toThrow(/session is idle/);
  });

  it('rejects interop before concurrent', () => {
    const s = initNewArchitecture({ target: 'ios', appName: 'X' });
    startNewArchInit(s);
    expect(() => bridgeLegacyModule(s, 'X')).toThrow(/session is initializing/);
  });

  it('allows ready directly from concurrent (no legacy modules)', () => {
    const s = initNewArchitecture({ target: 'ios', appName: 'X' });
    startNewArchInit(s);
    enableConcurrentReact(s);
    markNewArchReady(s);
    expect(s.state).toBe('ready');
    expect(s.bridgedLegacyModules).toHaveLength(0);
  });

  it('rejects empty inputs', () => {
    expect(() => initNewArchitecture({ target: 'ios', appName: '' })).toThrow(/appName/);
    const s = initNewArchitecture({ target: 'ios', appName: 'X' });
    startNewArchInit(s);
    enableConcurrentReact(s);
    expect(() => bridgeLegacyModule(s, '')).toThrow(/moduleName/);
  });
});
