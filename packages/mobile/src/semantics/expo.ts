import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * Expo axis — build config load + deep link resolve + push notification +
 * build complete の 4 step deterministic state machine。
 */
export type ExpoState = 'idle' | 'config-loaded' | 'link-resolved' | 'push-received' | 'build-completed';

export interface ExpoSession {
  target: MobileTarget;
  appSlug: string;
  state: ExpoState;
  resolvedLinks: string[];
  pushNotifications: string[];
  configHash: string | null;
  history: AxisStep<ExpoState>[];
}

function emit(
  session: ExpoSession,
  neutralEvent:
    | 'expo.build_config_loaded'
    | 'expo.deep_link_resolved'
    | 'expo.push_notification_received'
    | 'expo.build_completed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ExpoState> {
  const step: AxisStep<ExpoState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { appSlug: session.appSlug, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function loadExpoBuildConfig(input: {
  target: MobileTarget;
  appSlug: string;
  configHash: string;
}): ExpoSession {
  if (input.appSlug.length === 0) {
    throw new Error('loadExpoBuildConfig: appSlug must not be empty');
  }
  if (input.configHash.length === 0) {
    throw new Error('loadExpoBuildConfig: configHash must not be empty');
  }
  const session: ExpoSession = {
    target: input.target,
    appSlug: input.appSlug,
    state: 'config-loaded',
    resolvedLinks: [],
    pushNotifications: [],
    configHash: input.configHash,
    history: [],
  };
  emit(session, 'expo.build_config_loaded', { configHash: input.configHash });
  return session;
}

export function resolveDeepLink(
  session: ExpoSession,
  input: { scheme: string; path: string },
): AxisStep<ExpoState> {
  if (session.state === 'idle') {
    throw new Error('resolveDeepLink: build config must be loaded first');
  }
  const link = `${input.scheme}://${input.path}`;
  session.resolvedLinks.push(link);
  session.state = 'link-resolved';
  return emit(session, 'expo.deep_link_resolved', {
    scheme: input.scheme,
    path: input.path,
    linkCount: session.resolvedLinks.length,
  });
}

export function receivePushNotification(
  session: ExpoSession,
  input: { notificationId: string; category: string },
): AxisStep<ExpoState> {
  if (session.state === 'idle') {
    throw new Error('receivePushNotification: build config must be loaded first');
  }
  session.pushNotifications.push(input.notificationId);
  session.state = 'push-received';
  return emit(session, 'expo.push_notification_received', {
    notificationId: input.notificationId,
    category: input.category,
    pushCount: session.pushNotifications.length,
  });
}

export function completeExpoBuild(
  session: ExpoSession,
): AxisStep<ExpoState> {
  if (session.state === 'idle') {
    throw new Error('completeExpoBuild: build config must be loaded first');
  }
  session.state = 'build-completed';
  return emit(session, 'expo.build_completed', {
    resolvedLinkCount: session.resolvedLinks.length,
    pushCount: session.pushNotifications.length,
  });
}
