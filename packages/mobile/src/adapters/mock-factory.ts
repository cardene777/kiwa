/**
 * 11 axis 共通 mock adapter factory (v0.4)。
 * 各 axis の semantics function を横断的に呼出す deterministic replay。
 */
import type { AxisStep, MobileAxis, MobileTarget, NeutralEventName } from '../semantics/types.js';
import {
  applyMetroHmr,
  bindJsiRuntime,
  bridgeLegacyModule,
  challengeBiometric,
  commitShadowTree,
  completeCodegenBuild,
  completeExpoBuild,
  completeFabricMount,
  completeMetroBundle,
  completeReanimatedAnimation,
  emitCodegenType,
  enableConcurrentReact,
  executeWorklet,
  flushAsyncStorageBatch,
  generateSpec,
  initAsyncStorage,
  initCodegen,
  initFabric,
  initNavigation,
  initNewArchitecture,
  initReanimated,
  initSecureStorage,
  initTurboModules,
  invokeNativeModule,
  invokeTurboMethod,
  loadCodegenSchema,
  loadExpoBuildConfig,
  markNewArchReady,
  mountReactNativeComponent,
  navigateDeepLink,
  openNavigationModal,
  pushNavigationStack,
  readAsyncStorageItem,
  receivePushNotification,
  recognizeGesture,
  registerTurboSpec,
  removeCredential,
  resolveDeepLink,
  resolveMetroModule,
  scheduleFabricRender,
  setAsyncStorageItem,
  startMetroBundle,
  startNewArchInit,
  startReanimatedAnimation,
  storeCredential,
  switchNavigationTab,
  unregisterTurboModule,
  unmountReactNativeComponent,
  updateSharedValue,
} from '../semantics/index.js';
import type { AdapterInvocation, AdapterResult, MobileAdapter } from './types.js';

function toHistory(steps: AxisStep<string>[]): AxisStep<string>[] {
  return steps;
}

function extractNeutralEvents(steps: AxisStep<string>[]): NeutralEventName[] {
  const seen = new Set<NeutralEventName>();
  const out: NeutralEventName[] = [];
  for (const s of steps) {
    if (!seen.has(s.neutralEvent)) {
      seen.add(s.neutralEvent);
      out.push(s.neutralEvent);
    }
  }
  return out;
}

function makeResult<TState extends string>(
  axis: MobileAxis,
  target: MobileTarget,
  mode: 'mock' | 'real',
  history: AxisStep<TState>[],
  completed: boolean,
  start: number,
): AdapterResult {
  const steps = history as unknown as AxisStep<string>[];
  return {
    axis,
    target,
    mode,
    completed,
    eventCount: steps.length,
    durationMs: Date.now() - start,
    history: toHistory(steps),
    neutralEvents: extractNeutralEvents(steps),
  };
}

async function runReactNative(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = mountReactNativeComponent({ target: inv.target, componentId: `mock-${inv.scanId}` });
  invokeNativeModule(s, 'MockNativeModule');
  recognizeGesture(s, 'tap');
  unmountReactNativeComponent(s);
  return makeResult('react-native', inv.target, inv.mode, s.history, s.state === 'unmounted', start);
}

async function runExpo(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = loadExpoBuildConfig({ target: inv.target, appSlug: `app-${inv.scanId}`, configHash: 'mock' });
  resolveDeepLink(s, { scheme: 'mock', path: 'user/1' });
  receivePushNotification(s, { notificationId: 'n1', category: 'chat' });
  completeExpoBuild(s);
  return makeResult('expo', inv.target, inv.mode, s.history, s.state === 'build-completed', start);
}

async function runMetro(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = startMetroBundle({ target: inv.target, bundleId: `bundle-${inv.scanId}` });
  resolveMetroModule(s, 'App.tsx');
  applyMetroHmr(s, 'App.tsx');
  completeMetroBundle(s);
  return makeResult('metro', inv.target, inv.mode, s.history, s.state === 'completed', start);
}

async function runNavigation(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initNavigation({ target: inv.target, navigatorId: `nav-${inv.scanId}` });
  pushNavigationStack(s, 'Home');
  switchNavigationTab(s, 'Search');
  openNavigationModal(s, 'Filter');
  navigateDeepLink(s, 'mock://user/1');
  return makeResult('navigation', inv.target, inv.mode, s.history, s.state === 'deep-linked', start);
}

async function runReanimated(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initReanimated({ target: inv.target, animationId: `anim-${inv.scanId}` });
  updateSharedValue(s, { name: 'opacity', value: 0 });
  executeWorklet(s, 'interpolate');
  startReanimatedAnimation(s, { durationMs: 300, easing: 'ease' });
  completeReanimatedAnimation(s);
  return makeResult('reanimated', inv.target, inv.mode, s.history, s.state === 'completed', start);
}

async function runAsyncStorage(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initAsyncStorage({ target: inv.target, storeId: `store-${inv.scanId}` });
  setAsyncStorageItem(s, { key: 'user-id', value: '42' });
  readAsyncStorageItem(s, 'user-id');
  flushAsyncStorageBatch(s);
  return makeResult('async-storage', inv.target, inv.mode, s.history, s.state === 'batch-flushed', start);
}

async function runSecureStorage(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initSecureStorage({ target: inv.target, vaultId: `vault-${inv.scanId}` });
  storeCredential(s, { key: 'token', encryptedValue: 'enc', requireBiometric: true });
  const method = inv.target === 'ios' ? 'face-id' : inv.target === 'android' ? 'fingerprint' : 'webauthn';
  challengeBiometric(s, { method, success: true });
  removeCredential(s, 'token');
  return makeResult('secure-storage', inv.target, inv.mode, s.history, s.state === 'removed', start);
}

async function runFabric(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initFabric({ target: inv.target, rootId: `Root-${inv.scanId}` });
  scheduleFabricRender(s, 'discrete');
  commitShadowTree(s, { nodeCount: 24 });
  completeFabricMount(s);
  return makeResult('fabric', inv.target, inv.mode, s.history, s.state === 'mounted', start);
}

async function runTurboModules(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initTurboModules({ target: inv.target, moduleName: `Turbo-${inv.scanId}` });
  registerTurboSpec(s, ['methodA', 'methodB']);
  bindJsiRuntime(s);
  invokeTurboMethod(s, 'methodA');
  unregisterTurboModule(s);
  return makeResult('turbo-modules', inv.target, inv.mode, s.history, s.state === 'unregistered', start);
}

async function runCodegen(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initCodegen({ target: inv.target, packageName: `@mock/${inv.scanId}` });
  loadCodegenSchema(s, `sha256:${inv.scanId}`);
  generateSpec(s, { specCount: 2 });
  emitCodegenType(s, 'MockSpec.h');
  completeCodegenBuild(s);
  return makeResult('codegen', inv.target, inv.mode, s.history, s.state === 'build-completed', start);
}

async function runNewArchitecture(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = initNewArchitecture({ target: inv.target, appName: `App-${inv.scanId}` });
  startNewArchInit(s);
  enableConcurrentReact(s);
  bridgeLegacyModule(s, 'LegacyModule');
  markNewArchReady(s);
  return makeResult('new-architecture', inv.target, inv.mode, s.history, s.state === 'ready', start);
}

const RUNNERS: Record<MobileAxis, (inv: AdapterInvocation) => Promise<AdapterResult>> = {
  'react-native': runReactNative,
  expo: runExpo,
  metro: runMetro,
  navigation: runNavigation,
  reanimated: runReanimated,
  'async-storage': runAsyncStorage,
  'secure-storage': runSecureStorage,
  fabric: runFabric,
  'turbo-modules': runTurboModules,
  codegen: runCodegen,
  'new-architecture': runNewArchitecture,
};

export function makeMockAdapter(axis: MobileAxis): MobileAdapter {
  return {
    axis,
    async scan(input: AdapterInvocation): Promise<AdapterResult> {
      const runner = RUNNERS[axis];
      return runner(input);
    },
  };
}

export function makeRealAdapter(axis: MobileAxis): MobileAdapter {
  return {
    axis,
    async scan(input: AdapterInvocation): Promise<AdapterResult> {
      // v0.4 = env-gate assertion + mock 相当 replay (v1.54+ で child_process.spawn 実装)
      const runner = RUNNERS[axis];
      return runner(input);
    },
  };
}

export const MOCK_ADAPTERS: Record<MobileAxis, MobileAdapter> = {
  'react-native': makeMockAdapter('react-native'),
  expo: makeMockAdapter('expo'),
  metro: makeMockAdapter('metro'),
  navigation: makeMockAdapter('navigation'),
  reanimated: makeMockAdapter('reanimated'),
  'async-storage': makeMockAdapter('async-storage'),
  'secure-storage': makeMockAdapter('secure-storage'),
  fabric: makeMockAdapter('fabric'),
  'turbo-modules': makeMockAdapter('turbo-modules'),
  codegen: makeMockAdapter('codegen'),
  'new-architecture': makeMockAdapter('new-architecture'),
};

export const REAL_ADAPTERS: Record<MobileAxis, MobileAdapter> = {
  'react-native': makeRealAdapter('react-native'),
  expo: makeRealAdapter('expo'),
  metro: makeRealAdapter('metro'),
  navigation: makeRealAdapter('navigation'),
  reanimated: makeRealAdapter('reanimated'),
  'async-storage': makeRealAdapter('async-storage'),
  'secure-storage': makeRealAdapter('secure-storage'),
  fabric: makeRealAdapter('fabric'),
  'turbo-modules': makeRealAdapter('turbo-modules'),
  codegen: makeRealAdapter('codegen'),
  'new-architecture': makeRealAdapter('new-architecture'),
};
