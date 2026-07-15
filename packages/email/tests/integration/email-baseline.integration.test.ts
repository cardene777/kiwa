/**
 * integration test — email domain の end-to-end workflow (send → delivery event 到着 →
 * signature verify → parse → status confirm) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  createEmailClient,
  verifyWebhookSignature,
  parseDeliveryEvent,
} from '../../src/index.js';

describe('email integration — send → webhook → parse workflow', () => {
  it('T-INT-E-001 send → delivery webhook を signature 検証 + parse まで通る', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const secret = 'whsec_test';
    const { id } = await client.send({ from: 'a@x', to: 'b@x', subject: 's' });
    const payload = JSON.stringify({ type: 'email.delivered', email_id: id, timestamp: 1, recipient: 'b@x' });
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const verify = verifyWebhookSignature(payload, sig, secret, 'resend');
    expect(verify.valid).toBe(true);
    const event = parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) });
    expect(event.type).toBe('delivered');
    expect(event.emailId).toBe(id);
  });

  it('T-INT-E-002 template send で renderedHtml が listSent に保持される', async () => {
    const client = createEmailClient({ provider: 'sendgrid', templates: { welcome: '<h1>{{name}}</h1>' } });
    await client.send({ from: 'a@x', to: 'b@x', subject: 'w', templateId: 'welcome', templateData: { name: 'kiwa' } });
    const sent = client.listSent();
    expect(sent[0]!.renderedHtml).toBe('<h1>kiwa</h1>');
  });

  it('T-INT-E-003 provider 別 send で id prefix が異なる', async () => {
    const resend = createEmailClient({ provider: 'resend' });
    const sendgrid = createEmailClient({ provider: 'sendgrid' });
    const r1 = await resend.send({ from: 'a@x', to: 'b@x', subject: 's' });
    const s1 = await sendgrid.send({ from: 'a@x', to: 'b@x', subject: 's' });
    expect(r1.id.startsWith('re-')).toBe(true);
    expect(s1.id.startsWith('sg-')).toBe(true);
  });

  it('T-INT-E-004 bounced event を parseDeliveryEvent が正規化', () => {
    const event = parseDeliveryEvent({
      provider: 'postmark',
      raw: { RecordType: 'Bounce', MessageID: 'pm-1', Recipient: 'x@x', Details: 'hard-bounce' },
    });
    expect(event.type).toBe('bounced');
    expect(event.reason).toBe('hard-bounce');
  });

  it('T-INT-E-005 invalid signature が verify で reject される', () => {
    const result = verifyWebhookSignature('payload', 'wrong_sig', 'secret', 'sendgrid');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
