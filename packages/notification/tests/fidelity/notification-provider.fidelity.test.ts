/**
 * fidelity test — createNotificationClient (kiwa mock) が reference impl と同じ挙動を示す
 * ことを検証。 5 case で push / sms / in-app / failure / clear の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createNotificationClient } from '../../src/index.js';

function referenceNotifyQueue() {
  const store: Array<{ channel: string; id: string }> = [];
  let counter = 0;
  return {
    async send(channel: string) {
      counter += 1;
      const id = `ref-${counter}`;
      store.push({ channel, id });
      return { id, status: 'queued' as const };
    },
    listSent() { return [...store]; },
  };
}

describe('notification client fidelity vs reference impl', () => {
  it('sendPush api = id 発行 + queued 状態を返す', async () => {
    const mock = createNotificationClient({ pushProvider: 'fcm' });
    const real = referenceNotifyQueue();
    const result = await assertFidelity({
      mockFn: async (t: string) => (await mock.sendPush({ deviceToken: t, title: 'a', body: 'b' })).status,
      realFn: async (_t: string) => (await real.send('push')).status,
      cases: [{ name: 'basic push', args: ['tok-1'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('sendSMS で id が smsProvider prefix を持つ', async () => {
    const mock = createNotificationClient({ smsProvider: 'twilio' });
    const res = await mock.sendSMS({ to: '+15551234', from: '+15559999', body: 'hi' });
    expect(res.id.startsWith('tw-')).toBe(true);
    expect(res.provider).toBe('twilio');
  });

  it('sendInApp が in-app channel + provider を保持', async () => {
    const mock = createNotificationClient();
    const res = await mock.sendInApp({ userId: 'u1', title: 't', body: 'b', category: 'alert' });
    expect(res.channel).toBe('in-app');
    expect(res.provider).toBe('in-app');
  });

  it('failOn callback で failed status + reason を返す', async () => {
    const mock = createNotificationClient({
      pushProvider: 'apns',
      failOn: (channel, msg) => channel === 'push' && (msg as { deviceToken?: string }).deviceToken === 'invalid',
    });
    const res = await mock.sendPush({ deviceToken: 'invalid', title: 't', body: 'b' });
    expect(res.status).toBe('failed');
    expect(res.reason).toContain('provider rejected');
  });

  it('clear で listSent が空になる', async () => {
    const mock = createNotificationClient();
    await mock.sendPush({ deviceToken: 't1', title: 't', body: 'b' });
    expect(mock.listSent().length).toBe(1);
    mock.clear();
    expect(mock.listSent().length).toBe(0);
  });
});
