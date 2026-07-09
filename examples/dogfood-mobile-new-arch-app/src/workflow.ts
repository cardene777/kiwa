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
  type MobileTarget,
} from '@kiwa-lab/mobile';

export interface WorkflowResult {
  target: MobileTarget;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: MobileTarget[] = ['ios', 'android', 'web'];

export function runFabricAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initFabric({ target: t, rootId: `Root-${t}` });
    scheduleFabricRender(s, 'discrete');
    commitShadowTree(s, { nodeCount: 24 });
    completeFabricMount(s);
    return {
      target: t,
      axis: 'fabric',
      eventCount: s.history.length,
      completed: s.state === 'mounted',
    };
  });
}

export function runTurboModulesAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initTurboModules({ target: t, moduleName: `Camera-${t}` });
    registerTurboSpec(s, ['takePhoto', 'startRecording']);
    bindJsiRuntime(s);
    invokeTurboMethod(s, 'takePhoto');
    unregisterTurboModule(s);
    return {
      target: t,
      axis: 'turbo-modules',
      eventCount: s.history.length,
      completed: s.state === 'unregistered',
    };
  });
}

export function runCodegenAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initCodegen({ target: t, packageName: `@app/native-${t}` });
    loadCodegenSchema(s, `sha256:${t}`);
    generateSpec(s, { specCount: 3 });
    emitCodegenType(s, 'NativeCameraSpec.h');
    completeCodegenBuild(s);
    return {
      target: t,
      axis: 'codegen',
      eventCount: s.history.length,
      completed: s.state === 'build-completed',
    };
  });
}

export function runNewArchitectureAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initNewArchitecture({ target: t, appName: `App-${t}` });
    startNewArchInit(s);
    enableConcurrentReact(s);
    bridgeLegacyModule(s, 'LegacyAudio');
    markNewArchReady(s);
    return {
      target: t,
      axis: 'new-architecture',
      eventCount: s.history.length,
      completed: s.state === 'ready',
    };
  });
}

export function runFullNewArchWorkflow(): WorkflowResult[] {
  return [
    ...runFabricAxis(),
    ...runTurboModulesAxis(),
    ...runCodegenAxis(),
    ...runNewArchitectureAxis(),
  ];
}
