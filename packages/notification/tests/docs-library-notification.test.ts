import { describe, expect, it } from 'vitest';
import {
  createIdempotencyCache,
  createNotificationClient,
  parseNotificationEvent,
  sendPushIdempotent,
} from '../src/index.js';

describe('library documentation notification recipes', () => {
  it('queues the documented FCM push and retains its message record', async () => {
    const client = createNotificationClient({ pushProvider: 'fcm', now: () => 1000, idSeed: 0 });
    const result = await client.sendPush({
      deviceToken: 'device-1',
      title: '注文を発送しました',
      body: '配送状況を確認できます',
      data: { orderId: 'o-1' },
    });

    expect(result).toEqual({ id: 'fcm-1', channel: 'push', provider: 'fcm', status: 'queued', acceptedAt: 1000 });
    expect(client.listSent()[0]?.message).toMatchObject({ deviceToken: 'device-1' });
  });

  it('keeps dispatch order and a provider rejection visible to the caller', async () => {
    const client = createNotificationClient({ pushProvider: 'apns', smsProvider: 'sns' });
    const results = await client.dispatch(['push', 'sms', 'in-app'], {
      push: { deviceToken: 'ios-token', title: '発送しました', body: '配送状況を確認できます' },
      sms: { to: '+15550000001', from: '+15550000002', body: '注文を発送しました' },
      inApp: { userId: 'u-1', title: '発送しました', body: '配送状況を確認できます' },
    });
    const rejected = createNotificationClient({ failOn: (channel) => channel === 'sms' });
    const failed = await rejected.sendSMS({ to: '+15550000001', from: '+15550000002', body: '確認コード 1234' });

    expect(results.map((result) => [result.channel, result.provider, result.status])).toEqual([
      ['push', 'apns', 'queued'],
      ['sms', 'sns', 'queued'],
      ['in-app', 'in-app', 'queued'],
    ]);
    expect(failed).toMatchObject({ channel: 'sms', status: 'failed', reason: 'provider rejected' });
  });

  it('does not queue a duplicate push and normalizes its delivery event', async () => {
    const client = createNotificationClient({ pushProvider: 'fcm', idSeed: 0 });
    const cache = createIdempotencyCache();
    const message = { deviceToken: 'device-1', title: '更新', body: '新着があります' };
    const first = await sendPushIdempotent(client, message, 'order-o-1', cache);
    const second = await sendPushIdempotent(client, message, 'order-o-1', cache);
    const event = parseNotificationEvent({
      provider: 'fcm',
      raw: { event: 'delivered', notification_id: first.id, timestamp: 1_720_000_000_000, recipient: 'device-1' },
    });

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(client.listSent()).toHaveLength(1);
    expect(event).toMatchObject({ type: 'delivered', channel: 'push', notificationId: first.id, recipient: 'device-1' });
  });
});
