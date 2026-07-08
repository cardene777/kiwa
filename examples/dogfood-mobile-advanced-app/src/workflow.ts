import {
  challengeBiometric,
  completeReanimatedAnimation,
  executeWorklet,
  flushAsyncStorageBatch,
  initAsyncStorage,
  initNavigation,
  initReanimated,
  initSecureStorage,
  navigateDeepLink,
  openNavigationModal,
  pushNavigationStack,
  readAsyncStorageItem,
  removeCredential,
  retrieveCredential,
  setAsyncStorageItem,
  startReanimatedAnimation,
  storeCredential,
  switchNavigationTab,
  updateSharedValue,
  type MobileTarget,
} from '@kiwa/mobile';

export interface WorkflowResult {
  target: MobileTarget;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: MobileTarget[] = ['ios', 'android', 'web'];

export function runNavigationAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initNavigation({ target: t, navigatorId: `nav-${t}` });
    pushNavigationStack(s, 'HomeScreen');
    pushNavigationStack(s, 'DetailScreen');
    switchNavigationTab(s, 'Search');
    openNavigationModal(s, 'FilterModal');
    navigateDeepLink(s, `app-${t}://user/1`);
    return {
      target: t,
      axis: 'navigation',
      eventCount: s.history.length,
      completed: s.state === 'deep-linked',
    };
  });
}

export function runReanimatedAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initReanimated({ target: t, animationId: `anim-${t}` });
    updateSharedValue(s, { name: 'opacity', value: 0 });
    executeWorklet(s, 'interpolate');
    startReanimatedAnimation(s, { durationMs: 300, easing: 'ease' });
    completeReanimatedAnimation(s);
    return {
      target: t,
      axis: 'reanimated',
      eventCount: s.history.length,
      completed: s.state === 'completed',
    };
  });
}

export function runAsyncStorageAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initAsyncStorage({ target: t, storeId: `store-${t}` });
    setAsyncStorageItem(s, { key: 'user-id', value: '42' });
    readAsyncStorageItem(s, 'user-id');
    setAsyncStorageItem(s, { key: 'theme', value: 'dark' });
    flushAsyncStorageBatch(s);
    return {
      target: t,
      axis: 'async-storage',
      eventCount: s.history.length,
      completed: s.state === 'batch-flushed',
    };
  });
}

export function runSecureStorageAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initSecureStorage({ target: t, vaultId: `vault-${t}` });
    storeCredential(s, { key: 'auth-token', encryptedValue: 'enc:xxx', requireBiometric: true });
    const method = t === 'ios' ? 'face-id' : t === 'android' ? 'fingerprint' : 'webauthn';
    challengeBiometric(s, { method, success: true });
    retrieveCredential(s, 'auth-token');
    removeCredential(s, 'auth-token');
    return {
      target: t,
      axis: 'secure-storage',
      eventCount: s.history.length,
      completed: s.state === 'removed',
    };
  });
}

export function runFullAdvancedWorkflow(): WorkflowResult[] {
  return [
    ...runNavigationAxis(),
    ...runReanimatedAxis(),
    ...runAsyncStorageAxis(),
    ...runSecureStorageAxis(),
  ];
}
