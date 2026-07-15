import type { NotificationProvider, NotificationChannel } from './client.js';

export type NotificationEventType = 'delivered' | 'opened' | 'clicked' | 'failed' | 'unknown';

export interface RawNotificationEvent {
  provider: NotificationProvider;
  raw: Record<string, unknown>;
}

export interface NormalizedNotificationEvent {
  type: NotificationEventType;
  provider: NotificationProvider;
  channel: NotificationChannel;
  notificationId: string;
  timestamp: number;
  recipient?: string;
  reason?: string;
}

/**
 * provider 別 event payload を統一 shape に正規化。 fcm=notification_id / apns=apns-id /
 * twilio=MessageSid / sns=MessageId / in-app=id の field 差を吸収。
 */
export function parseNotificationEvent(rawEvent: RawNotificationEvent): NormalizedNotificationEvent {
  const { provider, raw } = rawEvent;
  const idKey = { fcm: 'notification_id', apns: 'apns-id', twilio: 'MessageSid', sns: 'MessageId', 'in-app': 'id' }[provider];
  const typeKey = { fcm: 'event', apns: 'event', twilio: 'MessageStatus', sns: 'Event', 'in-app': 'event' }[provider];
  const rawType = String((raw as Record<string, unknown>)[typeKey] ?? '').toLowerCase();
  const type: NotificationEventType = normalizeType(rawType);
  const notificationId = String((raw as Record<string, unknown>)[idKey] ?? '');
  const timestamp = Number(raw.timestamp ?? raw.Timestamp ?? raw.created_at ?? 0);
  const channel: NotificationChannel = provider === 'twilio' || provider === 'sns' ? 'sms' : (provider === 'in-app' ? 'in-app' : 'push');
  const recipient = String(raw.recipient ?? raw.to ?? raw.To ?? raw.userId ?? '') || undefined;
  const reason = raw.reason ? String(raw.reason) : (raw.ErrorCode ? String(raw.ErrorCode) : undefined);
  const result: NormalizedNotificationEvent = { type, provider, channel, notificationId, timestamp };
  if (recipient !== undefined) result.recipient = recipient;
  if (reason !== undefined) result.reason = reason;
  return result;
}

function normalizeType(raw: string): NotificationEventType {
  if (raw.includes('undeliver') || raw.includes('fail') || raw.includes('error')) return 'failed';
  if (raw.includes('deliver') || raw === 'sent') return 'delivered';
  if (raw.includes('open')) return 'opened';
  if (raw.includes('click')) return 'clicked';
  return 'unknown';
}
