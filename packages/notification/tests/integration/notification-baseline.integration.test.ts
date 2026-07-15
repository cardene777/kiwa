/**
 * integration test — notification end-to-end workflow (dispatch → event 到着 → parse →
 * status confirm) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createNotificationClient,
  parseNotificationEvent,
} from '../../src/index.js';

describe('notification integration — dispatch → event → parse workflow', () => {
  it('T-INT-N-001 dispatch(push+sms+in-app) が 3 channel の record を返す', async () => {
    const client = createNotificationClient({ pushProvider: 'fcm', smsProvider: 'twilio' });
    const results = await client.dispatch(['push', 'sms', 'in-app'], {
      push: { deviceToken: 't', title: 'a', body: 'b' },
      sms: { to: '+1', from: '+2', body: 'x' },
      inApp: { userId: 'u', title: 'x', body: 'y' },
    });
    expect(results.length).toBe(3);
    expect(results.map((r) => r.channel)).toEqual(['push', 'sms', 'in-app']);
  });

  it('T-INT-N-002 send → parseNotificationEvent が同 id で状態を追跡できる', async () => {
    const client = createNotificationClient({ pushProvider: 'fcm' });
    const res = await client.sendPush({ deviceToken: 't1', title: 'a', body: 'b' });
    const ev = parseNotificationEvent({ provider: 'fcm', raw: { event: 'delivered', notification_id: res.id, timestamp: 1 } });
    expect(ev.notificationId).toBe(res.id);
    expect(ev.type).toBe('delivered');
  });

  it('T-INT-N-003 provider 別 send で id prefix が期待通り異なる', async () => {
    const fcm = createNotificationClient({ pushProvider: 'fcm' });
    const apns = createNotificationClient({ pushProvider: 'apns' });
    const r1 = await fcm.sendPush({ deviceToken: 't', title: 'a', body: 'b' });
    const r2 = await apns.sendPush({ deviceToken: 't', title: 'a', body: 'b' });
    expect(r1.id.startsWith('fcm-')).toBe(true);
    expect(r2.id.startsWith('apns-')).toBe(true);
  });

  it('T-INT-N-004 dispatch で指定しなかった channel は record 対象外', async () => {
    const client = createNotificationClient();
    const results = await client.dispatch(['push'], {
      push: { deviceToken: 't', title: 'a', body: 'b' },
      sms: { to: '+1', from: '+2', body: 'x' },
    });
    expect(results.length).toBe(1);
    expect(results[0]!.channel).toBe('push');
  });

  it('T-INT-N-005 failed status + listSent の一貫性', async () => {
    const client = createNotificationClient({
      failOn: (channel) => channel === 'push',
    });
    await client.sendPush({ deviceToken: 't', title: 'a', body: 'b' });
    const records = client.listSent();
    expect(records.length).toBe(1);
    expect(records[0]!.status).toBe('failed');
  });

  it('T-INT-N-006 sendPushWithRetry: single attempt success', async () => {
    const { sendPushWithRetry } = await import('../../src/index.js');
    const client = createNotificationClient({});
    const result = await sendPushWithRetry(client, { deviceToken: 't', title: 'a', body: 'b' });
    expect(result.attempts).toBe(1);
  });

  it('T-INT-N-007 sendPushBatch: 5 push 一括', async () => {
    const { sendPushBatch } = await import('../../src/index.js');
    const client = createNotificationClient({});
    const msgs = Array.from({ length: 5 }, (_, i) => ({ deviceToken: `t${i}`, title: 'a', body: 'b' }));
    const result = await sendPushBatch(client, msgs);
    expect(result.total).toBe(5);
  });

  it('T-INT-N-008 sendPushIdempotent: dedup', async () => {
    const { createIdempotencyCache, sendPushIdempotent } = await import('../../src/index.js');
    const client = createNotificationClient({});
    const cache = createIdempotencyCache();
    const first = await sendPushIdempotent(client, { deviceToken: 't', title: 'a', body: 'b' }, 'idem-1', cache);
    expect(first.cached).toBe(false);
    const second = await sendPushIdempotent(client, { deviceToken: 't', title: 'a', body: 'b' }, 'idem-1', cache);
    expect(second.cached).toBe(true);
  });

  it('T-INT-N-009 sendPushObservable: hook 発火', async () => {
    const { createHookRegistry, sendPushObservable } = await import('../../src/index.js');
    const client = createNotificationClient({});
    const hooks = createHookRegistry();
    const events: string[] = [];
    hooks.register('before-send', () => events.push('before'));
    hooks.register('after-send', () => events.push('after'));
    await sendPushObservable(client, { deviceToken: 't', title: 'a', body: 'b' }, hooks);
    expect(events).toEqual(['before', 'after']);
  });

  it('T-INT-N-010 circuit-breaker: state 遷移', async () => {
    const { createCircuitBreaker } = await import('../../src/index.js');
    const client = createNotificationClient({});
    const breaker = createCircuitBreaker(client, { failureThreshold: 3, resetTimeoutMs: 100 });
    const result = await breaker.sendPush({ deviceToken: 't', title: 'a', body: 'b' });
    expect(result.circuitState).toBe('closed');
  });
});
