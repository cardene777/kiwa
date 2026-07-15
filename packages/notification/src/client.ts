export type PushProvider = 'fcm' | 'apns';
export type SmsProvider = 'twilio' | 'sns';
export type NotificationProvider = PushProvider | SmsProvider | 'in-app';
export type NotificationChannel = 'push' | 'sms' | 'in-app';

export interface PushMessage {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export interface SmsMessage {
  to: string;
  from: string;
  body: string;
  mediaUrl?: string;
}

export interface InAppMessage {
  userId: string;
  title: string;
  body: string;
  category?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface NotificationSendResult {
  id: string;
  channel: NotificationChannel;
  provider: NotificationProvider;
  status: 'queued' | 'sent' | 'failed';
  acceptedAt: number;
  reason?: string;
}

export interface SentNotificationRecord extends NotificationSendResult {
  message: PushMessage | SmsMessage | InAppMessage;
}

export interface NotificationClient {
  pushProvider: PushProvider;
  smsProvider: SmsProvider;
  sendPush: (msg: PushMessage) => Promise<NotificationSendResult>;
  sendSMS: (msg: SmsMessage) => Promise<NotificationSendResult>;
  sendInApp: (msg: InAppMessage) => Promise<NotificationSendResult>;
  dispatch: (channels: NotificationChannel[], payload: {
    push?: PushMessage;
    sms?: SmsMessage;
    inApp?: InAppMessage;
  }) => Promise<NotificationSendResult[]>;
  listSent: () => SentNotificationRecord[];
  clear: () => void;
}

export interface CreateNotificationClientOptions {
  pushProvider?: PushProvider;
  smsProvider?: SmsProvider;
  failOn?: (channel: NotificationChannel, msg: PushMessage | SmsMessage | InAppMessage) => boolean;
  now?: () => number;
  idSeed?: number;
}

/**
 * provider 別のみ id prefix + status label に mock 差を出しつつ、 全 channel を共通 interface で
 * 叩ける。 実 SDK (Firebase Admin / apns2 / twilio / @aws-sdk/client-sns) を差し替えても同 signature。
 */
export function createNotificationClient(options: CreateNotificationClientOptions = {}): NotificationClient {
  const pushProvider = options.pushProvider ?? 'fcm';
  const smsProvider = options.smsProvider ?? 'twilio';
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  const failOn = options.failOn;
  const idPrefix: Record<NotificationProvider, string> = {
    fcm: 'fcm', apns: 'apns', twilio: 'tw', sns: 'sns', 'in-app': 'ia',
  };
  const sent: SentNotificationRecord[] = [];
  let counter = options.idSeed ?? 0;

  function build(
    channel: NotificationChannel,
    provider: NotificationProvider,
    msg: PushMessage | SmsMessage | InAppMessage,
  ): NotificationSendResult {
    counter += 1;
    const id = `${idPrefix[provider]}-${counter}`;
    const acceptedAt = now();
    if (failOn && failOn(channel, msg)) {
      const failed: NotificationSendResult = { id, channel, provider, status: 'failed', acceptedAt, reason: 'provider rejected' };
      sent.push({ ...failed, message: msg });
      return failed;
    }
    const result: NotificationSendResult = { id, channel, provider, status: 'queued', acceptedAt };
    sent.push({ ...result, message: msg });
    return result;
  }

  return {
    pushProvider,
    smsProvider,
    async sendPush(msg: PushMessage) { return build('push', pushProvider, msg); },
    async sendSMS(msg: SmsMessage) { return build('sms', smsProvider, msg); },
    async sendInApp(msg: InAppMessage) { return build('in-app', 'in-app', msg); },
    async dispatch(channels, payload) {
      const results: NotificationSendResult[] = [];
      for (const ch of channels) {
        if (ch === 'push' && payload.push) results.push(build('push', pushProvider, payload.push));
        if (ch === 'sms' && payload.sms) results.push(build('sms', smsProvider, payload.sms));
        if (ch === 'in-app' && payload.inApp) results.push(build('in-app', 'in-app', payload.inApp));
      }
      return results;
    },
    listSent(): SentNotificationRecord[] { return [...sent]; },
    clear(): void { sent.length = 0; },
  };
}
