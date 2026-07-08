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
  type MobileTarget,
} from '@kiwa-test/mobile';

export interface WorkflowResult {
  target: MobileTarget;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: MobileTarget[] = ['ios', 'android', 'web'];

export function runReactNativeAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = mountReactNativeComponent({ target: t, componentId: `Home-${t}` });
    invokeNativeModule(s, 'CameraModule');
    recognizeGesture(s, 'tap');
    unmountReactNativeComponent(s);
    return {
      target: t,
      axis: 'react-native',
      eventCount: s.history.length,
      completed: s.state === 'unmounted',
    };
  });
}

export function runExpoAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = loadExpoBuildConfig({ target: t, appSlug: `app-${t}`, configHash: `hash-${t}` });
    resolveDeepLink(s, { scheme: `app-${t}`, path: 'user/1' });
    receivePushNotification(s, { notificationId: `n-${t}`, category: 'chat' });
    completeExpoBuild(s);
    return {
      target: t,
      axis: 'expo',
      eventCount: s.history.length,
      completed: s.state === 'build-completed',
    };
  });
}

export function runMetroAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startMetroBundle({ target: t, bundleId: `bundle-${t}` });
    resolveMetroModule(s, 'App.tsx');
    resolveMetroModule(s, 'Home.tsx');
    applyMetroHmr(s, 'Home.tsx');
    completeMetroBundle(s);
    return {
      target: t,
      axis: 'metro',
      eventCount: s.history.length,
      completed: s.state === 'completed',
    };
  });
}

export function runFullMobileWorkflow(): WorkflowResult[] {
  return [
    ...runReactNativeAxis(),
    ...runExpoAxis(),
    ...runMetroAxis(),
  ];
}
