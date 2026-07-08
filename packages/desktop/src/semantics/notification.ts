import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Notification axis (v0.2) — schedule + display + action + dismiss の 4 step 遷移。
 * macOS UserNotifications + Windows Toast + Linux libnotify の 3 target を uniform 扱い。
 */
export type NotificationState =
  | 'idle'
  | 'scheduled'
  | 'displayed'
  | 'action-invoked'
  | 'dismissed';

export interface NotificationSession {
  target: DesktopTarget;
  notificationId: string;
  title: string;
  state: NotificationState;
  scheduledAtMs: number;
  displayedAtMs: number;
  actions: string[];
  dismissed: boolean;
  history: AxisStep<NotificationState>[];
}

function emit(
  session: NotificationSession,
  neutralEvent:
    | 'notification.scheduled'
    | 'notification.displayed'
    | 'notification.action_invoked'
    | 'notification.dismissed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<NotificationState> {
  const step: AxisStep<NotificationState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { notificationId: session.notificationId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function scheduleNotification(input: {
  target: DesktopTarget;
  notificationId: string;
  title: string;
  scheduledAtMs: number;
}): NotificationSession {
  if (input.notificationId.length === 0) {
    throw new Error('scheduleNotification: notificationId must not be empty');
  }
  if (input.title.length === 0) throw new Error('scheduleNotification: title must not be empty');
  if (input.scheduledAtMs < 0) throw new Error('scheduleNotification: scheduledAtMs must be non-negative');
  const session: NotificationSession = {
    target: input.target,
    notificationId: input.notificationId,
    title: input.title,
    state: 'scheduled',
    scheduledAtMs: input.scheduledAtMs,
    displayedAtMs: 0,
    actions: [],
    dismissed: false,
    history: [],
  };
  emit(session, 'notification.scheduled', {
    title: input.title,
    scheduledAtMs: input.scheduledAtMs,
  });
  return session;
}

export function displayNotification(
  session: NotificationSession,
  displayedAtMs: number,
): AxisStep<NotificationState> {
  if (session.state !== 'scheduled') throw new Error('displayNotification: not scheduled');
  if (displayedAtMs < session.scheduledAtMs) {
    throw new Error('displayNotification: displayedAtMs must be >= scheduledAtMs');
  }
  session.displayedAtMs = displayedAtMs;
  session.state = 'displayed';
  return emit(session, 'notification.displayed', {
    displayedAtMs,
    latencyMs: displayedAtMs - session.scheduledAtMs,
  });
}

export function invokeNotificationAction(
  session: NotificationSession,
  actionId: string,
): AxisStep<NotificationState> {
  if (session.state !== 'displayed' && session.state !== 'action-invoked') {
    throw new Error('invokeNotificationAction: notification not displayed');
  }
  if (actionId.length === 0) throw new Error('invokeNotificationAction: actionId must not be empty');
  session.actions.push(actionId);
  session.state = 'action-invoked';
  return emit(session, 'notification.action_invoked', {
    actionId,
    actionCount: session.actions.length,
  });
}

export function dismissNotification(
  session: NotificationSession,
): AxisStep<NotificationState> {
  if (session.state === 'idle' || session.state === 'scheduled') {
    throw new Error('dismissNotification: notification not displayed');
  }
  session.dismissed = true;
  session.state = 'dismissed';
  return emit(session, 'notification.dismissed', {
    actionCount: session.actions.length,
    dismissed: true,
  });
}
