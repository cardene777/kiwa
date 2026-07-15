import type { NotificationClient, InAppMessage, NotificationSendResult } from './client.js';

export interface InAppDispatchConfig {
  channel?: string;
  broadcast?: boolean;
}

export async function sendInApp(
  client: NotificationClient,
  msg: InAppMessage,
  _config: InAppDispatchConfig = {},
): Promise<NotificationSendResult> {
  return client.sendInApp(msg);
}
