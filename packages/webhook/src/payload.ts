import type { WebhookProvider } from './client.js';

export type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.updated'
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'message'
  | 'app_mention'
  | 'sms.delivered'
  | 'sms.failed'
  | 'unknown';

export interface RawWebhookEvent {
  provider: WebhookProvider;
  raw: Record<string, unknown>;
}

export interface NormalizedWebhookEvent {
  type: WebhookEventType;
  provider: WebhookProvider;
  eventId: string;
  occurredAt: number;
  resource?: string;
}

/**
 * provider 別 event payload を統一 shape に正規化。 field 名の違い
 * (Stripe = type / GitHub = X-GitHub-Event header header → raw.event / Slack = event.type
 * / Twilio = MessageStatus) を吸収する。
 */
export function parseWebhookPayload(rawEvent: RawWebhookEvent): NormalizedWebhookEvent {
  const { provider, raw } = rawEvent;
  const rawType = extractType(provider, raw);
  const type = normalizeType(provider, rawType);
  const eventId = extractId(provider, raw);
  const occurredAt = Number(raw.created ?? raw.event_time ?? raw.Timestamp ?? raw.timestamp ?? 0);
  const resource = extractResource(provider, raw);
  const result: NormalizedWebhookEvent = { type, provider, eventId, occurredAt };
  if (resource !== undefined) result.resource = resource;
  return result;
}

function extractType(provider: WebhookProvider, raw: Record<string, unknown>): string {
  if (provider === 'stripe') return String(raw.type ?? '');
  if (provider === 'github') return String(raw.event ?? raw.action ?? '');
  if (provider === 'slack') {
    const event = raw.event as Record<string, unknown> | undefined;
    return String(event?.type ?? '');
  }
  return String(raw.MessageStatus ?? raw.EventType ?? '');
}

function normalizeType(provider: WebhookProvider, rawType: string): WebhookEventType {
  const t = rawType.toLowerCase();
  if (provider === 'stripe') {
    if (t.startsWith('payment_intent.succeeded') || t === 'payment.succeeded') return 'payment.succeeded';
    if (t.startsWith('payment_intent.failed') || t === 'payment.failed') return 'payment.failed';
    if (t.startsWith('customer.subscription.updated')) return 'subscription.updated';
    return 'unknown';
  }
  if (provider === 'github') {
    if (t === 'push') return 'push';
    if (t === 'pull_request') return 'pull_request';
    if (t === 'issues') return 'issues';
    return 'unknown';
  }
  if (provider === 'slack') {
    if (t === 'message') return 'message';
    if (t === 'app_mention') return 'app_mention';
    return 'unknown';
  }
  if (t === 'delivered' || t === 'sent') return 'sms.delivered';
  if (t === 'failed' || t === 'undelivered') return 'sms.failed';
  return 'unknown';
}

function extractId(provider: WebhookProvider, raw: Record<string, unknown>): string {
  if (provider === 'stripe') return String(raw.id ?? '');
  if (provider === 'github') return String(raw.delivery ?? raw.id ?? '');
  if (provider === 'slack') return String(raw.event_id ?? '');
  return String(raw.MessageSid ?? raw.SmsSid ?? '');
}

function extractResource(provider: WebhookProvider, raw: Record<string, unknown>): string | undefined {
  if (provider === 'stripe') {
    const data = raw.data as Record<string, unknown> | undefined;
    const object = data?.object as Record<string, unknown> | undefined;
    if (object?.id) return String(object.id);
    return undefined;
  }
  if (provider === 'github') {
    const repo = raw.repository as Record<string, unknown> | undefined;
    if (repo?.full_name) return String(repo.full_name);
    return undefined;
  }
  if (provider === 'slack') {
    const event = raw.event as Record<string, unknown> | undefined;
    if (event?.channel) return String(event.channel);
    return undefined;
  }
  if (raw.To) return String(raw.To);
  return undefined;
}
