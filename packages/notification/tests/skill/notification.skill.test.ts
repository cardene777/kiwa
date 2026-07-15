/**
 * skill test — notification skill が主要 API (createNotificationClient / sendPush /
 * sendSMS / sendInApp / parseNotificationEvent) を全て公開し、 4 provider 別 event を
 * 正規化 shape に変換できることを assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createNotificationClient,
  sendPush,
  sendSMS,
  sendInApp,
  parseNotificationEvent,
} from '../../src/index.js';

describe('notification skill assertions', () => {
  it('createNotificationClient を 4 provider 組み合わせで instantiate 可能', () => {
    for (const push of ['fcm', 'apns'] as const) {
      for (const sms of ['twilio', 'sns'] as const) {
        const c = createNotificationClient({ pushProvider: push, smsProvider: sms });
        expect(c.pushProvider).toBe(push);
        expect(c.smsProvider).toBe(sms);
      }
    }
  });

  it('sendPush / sendSMS / sendInApp helper が client method を経由して呼出される', async () => {
    const client = createNotificationClient();
    const push = await sendPush(client, { deviceToken: 't', title: 'a', body: 'b' });
    const sms = await sendSMS(client, { to: '+1', from: '+2', body: 'x' });
    const inApp = await sendInApp(client, { userId: 'u', title: 't', body: 'b' });
    expect(push.channel).toBe('push');
    expect(sms.channel).toBe('sms');
    expect(inApp.channel).toBe('in-app');
  });

  it('parseNotificationEvent が 4 provider の payload を統一 shape に変換', () => {
    const fcm = parseNotificationEvent({ provider: 'fcm', raw: { event: 'delivered', notification_id: 'fcm-1', timestamp: 100 } });
    const apns = parseNotificationEvent({ provider: 'apns', raw: { event: 'opened', 'apns-id': 'apns-1', timestamp: 200 } });
    const twilio = parseNotificationEvent({ provider: 'twilio', raw: { MessageStatus: 'delivered', MessageSid: 'SM1', To: '+1' } });
    const sns = parseNotificationEvent({ provider: 'sns', raw: { Event: 'sent', MessageId: 'sns-1' } });
    expect(fcm.type).toBe('delivered');
    expect(apns.type).toBe('opened');
    expect(twilio.channel).toBe('sms');
    expect(sns.notificationId).toBe('sns-1');
  });

  it('dispatch が指定 channel だけ send + 結果配列を返す', async () => {
    const client = createNotificationClient();
    const results = await client.dispatch(['push', 'in-app'], {
      push: { deviceToken: 't', title: 'a', body: 'b' },
      inApp: { userId: 'u', title: 'x', body: 'y' },
    });
    expect(results.length).toBe(2);
    expect(results[0]!.channel).toBe('push');
    expect(results[1]!.channel).toBe('in-app');
  });

  it('failed event を parseNotificationEvent が failed type + reason に正規化', () => {
    const ev = parseNotificationEvent({ provider: 'twilio', raw: { MessageStatus: 'undelivered', MessageSid: 'SM2', ErrorCode: '30003' } });
    expect(ev.type).toBe('failed');
    expect(ev.reason).toBe('30003');
  });
});
