/**
 * fidelity test — createEmailClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で send / template / provider 差異 / failure path / clear の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createEmailClient } from '../../src/index.js';

function referenceEmailQueue() {
  const store: Array<{ to: string; subject: string; id: string }> = [];
  let counter = 0;
  return {
    async send(msg: { to: string; subject: string }) {
      counter += 1;
      const id = `ref-${counter}`;
      store.push({ ...msg, id });
      return { id, status: 'queued' as const };
    },
    listSent() {
      return [...store];
    },
  };
}

describe('email client fidelity vs reference impl', () => {
  it('send api = id 発行 + queued 状態を返す', async () => {
    const mock = createEmailClient({ provider: 'resend' });
    const real = referenceEmailQueue();
    const result = await assertFidelity({
      mockFn: async (to: string) => (await mock.send({ from: 'a@x', to, subject: 's' })).status,
      realFn: async (to: string) => (await real.send({ to, subject: 's' })).status,
      cases: [{ name: 'basic send', args: ['x@x'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 send で listSent が全 record を保持', async () => {
    const mock = createEmailClient({ provider: 'sendgrid' });
    for (let i = 0; i < 3; i++) await mock.send({ from: 'a@x', to: `u${i}@x`, subject: `s${i}` });
    expect(mock.listSent().length).toBe(3);
    expect(mock.listSent()[0]!.message.to).toBe('u0@x');
  });

  it('template 経由 send で renderedHtml が期待通り置換される', async () => {
    const mock = createEmailClient({ provider: 'postmark', templates: { welcome: '<b>{{name}}</b>' } });
    await mock.send({ from: 'a@x', to: 'b@x', subject: 'w', templateId: 'welcome', templateData: { name: 'kiwa' } });
    expect(mock.listSent()[0]!.renderedHtml).toBe('<b>kiwa</b>');
  });

  it('failOn callback で failure status を返す', async () => {
    const mock = createEmailClient({ provider: 'ses', failOn: (m) => m.to === 'block@x' });
    const res = await mock.send({ from: 'a@x', to: 'block@x', subject: 's' });
    expect(res.status).toBe('failed');
    expect(res.reason).toContain('provider rejected');
  });

  it('clear で listSent が空になる', async () => {
    const mock = createEmailClient({ provider: 'resend' });
    await mock.send({ from: 'a@x', to: 'b@x', subject: 's' });
    expect(mock.listSent().length).toBe(1);
    mock.clear();
    expect(mock.listSent().length).toBe(0);
  });
});
