import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createEmailClient,
  createIdempotencyCache,
  parseDeliveryEvent,
  sendIdempotent,
  sendWithRetry,
  verifyWebhookSignature,
} from '../src/index.js';

describe('library documentation email recipes', () => {
  it('queues a message and reports an unknown template as failed', async () => {
    const client = createEmailClient({ provider: 'resend' });
    const queued = await client.send({
      from: 'noreply@example.test',
      to: 'user@example.test',
      subject: 'Welcome',
      text: 'Hello',
    });
    const missing = await client.send({
      from: 'noreply@example.test',
      to: 'user@example.test',
      subject: 'Welcome',
      templateId: 'welcome',
      templateData: { displayName: 'Kiwa user' },
    });

    expect(queued).toMatchObject({ provider: 'resend', status: 'queued', id: expect.stringMatching(/^re-/) });
    expect(missing).toMatchObject({ status: 'failed', reason: 'template not found: welcome' });
    expect(client.listSent()).toHaveLength(2);
  });

  it('renders a template and verifies a raw delivery webhook before parsing it', async () => {
    const client = createEmailClient({
      provider: 'resend',
      templates: { welcome: '<h1>Welcome {{displayName}}</h1>' },
      now: () => 1_720_000_000_000,
    });
    const secret = 'whsec_local_test';
    const payload = JSON.stringify({
      type: 'email.delivered',
      email_id: 're-1',
      timestamp: 1_720_000_000_500,
      recipient: 'new-user@example.test',
    });
    const signature = createHmac('sha256', secret).update(payload).digest('hex');

    const sent = await client.send({
      from: 'noreply@example.test',
      to: 'new-user@example.test',
      subject: 'Welcome to Kiwa',
      templateId: 'welcome',
      templateData: { displayName: 'Kiwa user' },
    });

    expect(sent).toMatchObject({ provider: 'resend', status: 'queued', acceptedAt: 1_720_000_000_000 });
    expect(client.listSent()[0]).toMatchObject({ renderedHtml: '<h1>Welcome Kiwa user</h1>' });
    expect(verifyWebhookSignature(payload, signature, secret, 'resend').valid).toBe(true);
    expect(parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) })).toMatchObject({
      type: 'delivered',
      emailId: 're-1',
      recipient: 'new-user@example.test',
    });
    expect(verifyWebhookSignature(payload, 'invalid', secret, 'resend').valid).toBe(false);
  });

  it('retries a transient failure and keeps a duplicate idempotent', async () => {
    let attempts = 0;
    const client = createEmailClient({
      provider: 'resend',
      failOn: () => {
        attempts += 1;
        return attempts < 3;
      },
    });
    const message = {
      from: 'noreply@example.test',
      to: 'new-user@example.test',
      subject: 'Your account is ready',
      text: 'Welcome',
    };
    const retry = await sendWithRetry(client, message, { maxAttempts: 3, initialDelayMs: 1 });
    const cache = createIdempotencyCache();
    const first = await sendIdempotent(client, message, { cache, idempotencyKey: 'account-created:user-42' });
    const duplicate = await sendIdempotent(client, message, { cache, idempotencyKey: 'account-created:user-42' });

    expect(retry).toMatchObject({ status: 'queued', attempts: 3 });
    expect(first.cached).toBe(false);
    expect(duplicate).toMatchObject({ cached: true, id: first.id });
    expect(client.listSent()).toHaveLength(4);
  });
});
