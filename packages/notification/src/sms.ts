import type { NotificationClient, SmsMessage, NotificationSendResult } from './client.js';

export interface SmsDeliveryConfig {
  statusCallback?: string;
  maxPrice?: number;
}

export async function sendSMS(
  client: NotificationClient,
  msg: SmsMessage,
  _config: SmsDeliveryConfig = {},
): Promise<NotificationSendResult> {
  return client.sendSMS(msg);
}
