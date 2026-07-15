export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger?: { seconds: number } | { channelId: string } | null;
  channelId?: string;
}

export interface ScheduledNotification {
  identifier: string;
  payload: NotificationPayload;
  scheduledAt: number;
}

export interface NotificationDispatchResult {
  identifier: string;
  status: 'scheduled' | 'delivered' | 'failed';
  reason?: string;
}

/**
 * expo-notifications の scheduleNotificationAsync / presentNotificationAsync mock。
 * env が保持する scheduled list に push、 identifier を返す。
 */
export function dispatchNotification(
  env: { scheduled: ScheduledNotification[]; nowFn: () => number; nextId: () => string },
  payload: NotificationPayload,
): NotificationDispatchResult {
  const identifier = env.nextId();
  const scheduled: ScheduledNotification = {
    identifier,
    payload,
    scheduledAt: env.nowFn(),
  };
  env.scheduled.push(scheduled);
  const result: NotificationDispatchResult = { identifier, status: 'scheduled' };
  return result;
}
