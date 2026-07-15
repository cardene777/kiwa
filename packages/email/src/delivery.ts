import type { EmailProvider } from './client.js';

export type DeliveryEventType = 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unknown';

export interface RawDeliveryEvent {
  provider: EmailProvider;
  raw: Record<string, unknown>;
}

export interface NormalizedDeliveryEvent {
  type: DeliveryEventType;
  provider: EmailProvider;
  emailId: string;
  timestamp: number;
  recipient?: string;
  reason?: string;
}

/**
 * provider 別 event payload を統一 shape に正規化。 実 provider が返す field 名の違い
 * (Resend = type / SendGrid = event / Postmark = RecordType / SES = eventType) を吸収。
 */
export function parseDeliveryEvent(rawEvent: RawDeliveryEvent): NormalizedDeliveryEvent {
  const { provider, raw } = rawEvent;
  const typeKey = { resend: 'type', sendgrid: 'event', postmark: 'RecordType', ses: 'eventType' }[provider];
  const idKey = { resend: 'email_id', sendgrid: 'sg_message_id', postmark: 'MessageID', ses: 'mail.messageId' }[provider];
  const rawType = String((raw as Record<string, unknown>)[typeKey] ?? '').toLowerCase();
  const type: DeliveryEventType = normalizeType(rawType);
  const emailId = idKey.includes('.')
    ? String(getPath(raw, idKey.split('.')) ?? '')
    : String((raw as Record<string, unknown>)[idKey] ?? '');
  const timestamp = Number(raw.timestamp ?? raw.Timestamp ?? raw.created_at ?? 0);
  const recipient = String(raw.recipient ?? raw.email ?? raw.Recipient ?? '') || undefined;
  const reason = raw.reason ? String(raw.reason) : (raw.Details ? String(raw.Details) : undefined);
  const result: NormalizedDeliveryEvent = { type, provider, emailId, timestamp };
  if (recipient !== undefined) result.recipient = recipient;
  if (reason !== undefined) result.reason = reason;
  return result;
}

function normalizeType(raw: string): DeliveryEventType {
  if (raw.includes('deliver')) return 'delivered';
  if (raw.includes('bounce')) return 'bounced';
  if (raw.includes('open')) return 'opened';
  if (raw.includes('click')) return 'clicked';
  if (raw.includes('complain') || raw.includes('spam')) return 'complained';
  return 'unknown';
}

function getPath(obj: unknown, keys: string[]): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}
