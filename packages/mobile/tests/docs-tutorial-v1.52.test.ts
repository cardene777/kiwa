/**
 * v1.52-3 docs 補強 — tutorial 112 code snippet 検証。
 * **30 milestone 連続 snippet validation streak 突入** = v1.23 → v1.52。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import {
  bindJsiRuntime,
  bridgeLegacyModule,
  commitShadowTree,
  completeCodegenBuild,
  completeFabricMount,
  emitCodegenType,
  enableConcurrentReact,
  generateSpec,
  initCodegen,
  initFabric,
  initNewArchitecture,
  initTurboModules,
  invokeTurboMethod,
  loadCodegenSchema,
  markNewArchReady,
  registerTurboSpec,
  scheduleFabricRender,
  startNewArchInit,
  unregisterTurboModule,
} from '../src/index.js';

describe('tutorial 112 — Fabric concurrent renderer snippet', () => {
  it('schedule → commit → mount', () => {
    const s = initFabric({ target: 'ios', rootId: 'AppRoot' });
    scheduleFabricRender(s, 'discrete');
    commitShadowTree(s, { nodeCount: 24 });
    completeFabricMount(s);
    expect(s.state).toBe('mounted');
  });
});

describe('tutorial 112 — TurboModules JSI lifecycle snippet', () => {
  it('register → bind → invoke → unregister', () => {
    const s = initTurboModules({ target: 'android', moduleName: 'CameraTurbo' });
    registerTurboSpec(s, ['takePhoto']);
    bindJsiRuntime(s);
    invokeTurboMethod(s, 'takePhoto');
    unregisterTurboModule(s);
    expect(s.state).toBe('unregistered');
  });
});

describe('tutorial 112 — Codegen build flow snippet', () => {
  it('schema → spec → type → build', () => {
    const s = initCodegen({ target: 'ios', packageName: '@myapp/native' });
    loadCodegenSchema(s, 'sha256:abc');
    generateSpec(s, { specCount: 3 });
    emitCodegenType(s, 'NativeCameraSpec.h');
    completeCodegenBuild(s);
    expect(s.state).toBe('build-completed');
  });
});

describe('tutorial 112 — New Architecture full init snippet', () => {
  it('init → concurrent → interop → ready', () => {
    const s = initNewArchitecture({ target: 'ios', appName: 'MyApp' });
    startNewArchInit(s);
    enableConcurrentReact(s);
    bridgeLegacyModule(s, 'LegacyAudio');
    markNewArchReady(s);
    expect(s.state).toBe('ready');
  });
});
