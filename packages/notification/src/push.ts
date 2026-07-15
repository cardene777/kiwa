import type { NotificationClient, PushMessage, NotificationSendResult } from './client.js';

export interface PushDeliveryConfig {
  ttl?: number;
  priority?: 'normal' | 'high';
}

/**
 * top-level helper — client.sendPush() の 1-shot 呼出 shim。 実 code base が
 * `sendPush(client, msg)` の function-style を好む場合の代替 API。
 */
export async function sendPush(
  client: NotificationClient,
  msg: PushMessage,
  _config: PushDeliveryConfig = {},
): Promise<NotificationSendResult> {
  return client.sendPush(msg);
}
