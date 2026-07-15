import type { MacAppEnv } from './env.js';

export interface NotificationAction {
  id: string;
  title: string;
  destructive?: boolean;
}

export interface UserNotification {
  id?: string;
  title: string;
  body: string;
  subtitle?: string;
  sound?: string;
  category?: string;
  actions?: NotificationAction[];
  userInfo?: Record<string, string | number | boolean>;
}

export interface NotificationResult {
  id: string;
  scheduled: boolean;
  scheduledAt: number;
  bundleId: string;
  reason?: string;
}

let notificationCounter = 0;

/**
 * UserNotifications framework の schedule API 相当を mock。 実 UNUserNotificationCenter は
 * 起動せず、 env.eventLog に notification schedule を記録して user が listSent 相当で
 * assert 可能にする。
 */
export function emitUserNotification(env: MacAppEnv, notification: UserNotification): NotificationResult {
  notificationCounter += 1;
  const id = notification.id ?? `un-${notificationCounter}`;
  const scheduledAt = env.now();
  if (!notification.title.trim() || !notification.body.trim()) {
    const failed: NotificationResult = {
      id,
      scheduled: false,
      scheduledAt,
      bundleId: env.bundle.bundleId,
      reason: 'title / body must be non-empty',
    };
    env.eventLog.push({ at: scheduledAt, kind: `notification:rejected:${id}`, detail: failed });
    return failed;
  }
  const result: NotificationResult = {
    id,
    scheduled: true,
    scheduledAt,
    bundleId: env.bundle.bundleId,
  };
  env.eventLog.push({ at: scheduledAt, kind: `notification:scheduled:${id}`, detail: notification });
  return result;
}
