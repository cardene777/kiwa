/**
 * skill test — email skill が主要 API 3 種 (createEmailClient / verifyWebhookSignature /
 * parseDeliveryEvent) + template render を全て公開している + 実 provider 別に動作分岐する
 * ことを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createEmailClient,
  verifyWebhookSignature,
  parseDeliveryEvent,
  renderTemplate,
} from '../../src/index.js';
import { createHmac } from 'node:crypto';

describe('email skill assertions', () => {
  it('createEmailClient を 4 provider (resend/sendgrid/postmark/ses) 全てで instantiate 可能', () => {
    for (const provider of ['resend', 'sendgrid', 'postmark', 'ses'] as const) {
      const client = createEmailClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('verifyWebhookSignature が 4 provider で hmac 検証を成功させる', () => {
    for (const provider of ['resend', 'sendgrid', 'postmark', 'ses'] as const) {
      const secret = 's';
      const payload = 'p';
      const algorithm = provider === 'ses' ? 'sha1' : 'sha256';
      const encoding = provider === 'sendgrid' ? 'base64' : 'hex';
      const sig = createHmac(algorithm, secret).update(payload).digest(encoding);
      const result = verifyWebhookSignature(payload, sig, secret, provider);
      expect(result.valid).toBe(true);
      expect(result.provider).toBe(provider);
    }
  });

  it('parseDeliveryEvent が provider 別 event を正規化 shape に変換', () => {
    const ev = parseDeliveryEvent({ provider: 'sendgrid', raw: { event: 'delivered', sg_message_id: 'sg-1', timestamp: 100 } });
    expect(ev.type).toBe('delivered');
    expect(ev.emailId).toBe('sg-1');
  });

  it('renderTemplate が variables + missing を正しく collect', () => {
    const result = renderTemplate('<b>{{name}}</b>', { name: 'a' });
    expect(result.html).toBe('<b>a</b>');
    expect(result.variables).toEqual(['name']);
    expect(result.missing).toEqual([]);
  });

  it('EmailClient.listSent が message + rendered content の両方を保持', async () => {
    const client = createEmailClient({ provider: 'resend', templates: { t: '{{x}}' } });
    await client.send({ from: 'a@x', to: 'b@x', subject: 's', templateId: 't', templateData: { x: '1' } });
    const sent = client.listSent();
    expect(sent[0]!.renderedHtml).toBe('1');
    expect(sent[0]!.message.subject).toBe('s');
  });
});
