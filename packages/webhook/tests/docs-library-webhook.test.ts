import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createIdempotencyCache,
  createWebhookVerifier,
  dispatchWithRetry,
  verifyIdempotent,
} from '../src/index.js';

const secret = 'github-secret';

function signGitHub(payload: string): string {
  const digest = createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${digest}`;
}

describe('library documentation webhook recipes', () => {
  it('accepts a Stripe payment completion from its raw signed payload', () => {
    const secret = 'whsec_test';
    const timestamp = 1_700_000_000;
    const payload = JSON.stringify({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      created: timestamp,
      data: { object: { id: 'pi_1' } },
    });
    const digest = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
    const verifier = createWebhookVerifier({
      provider: 'stripe',
      secret,
      now: () => timestamp * 1000,
      toleranceSec: 60,
    });

    const result = verifier.verify({ payload, signature: `t=${timestamp},v1=${digest}` });

    expect(result).toMatchObject({
      id: 'evt-1',
      status: 'verified',
      event: { type: 'payment.succeeded', eventId: 'evt_1', resource: 'pi_1' },
    });
    expect(verifier.listDelivered()[0]?.signatureResult.valid).toBe(true);
  });

  it('rejects a changed GitHub body instead of making an event available', () => {
    const verifier = createWebhookVerifier({ provider: 'github', secret });
    const signedPayload = JSON.stringify({
      event: 'push',
      delivery: 'gh-1',
      timestamp: 1,
      repository: { full_name: 'acme/docs' },
    });

    const result = verifier.verify({
      payload: signedPayload.replace('push', 'issues'),
      signature: signGitHub(signedPayload),
    });

    expect(result).toMatchObject({ status: 'rejected', reason: 'digest mismatch' });
    expect(result.event).toBeUndefined();
  });

  it('retries a verified delivery and only verifies one idempotency key once', async () => {
    const verifier = createWebhookVerifier({ provider: 'github', secret });
    const payload = JSON.stringify({ event: 'push', delivery: 'gh-2', timestamp: 2 });
    const outcome = verifier.verify({ payload, signature: signGitHub(payload) });
    let calls = 0;

    const delivery = await dispatchWithRetry(async (event) => {
      calls += 1;
      expect(event.type).toBe('push');
      if (calls < 3) throw new Error('subscriber unavailable');
    }, outcome.event!, { maxAttempts: 3, initialDelayMs: 10, sleep: async () => undefined });

    const cache = createIdempotencyCache();
    const incoming = { payload, signature: signGitHub(payload) };
    const first = verifyIdempotent(verifier, incoming, 'gh-2', cache);
    const second = verifyIdempotent(verifier, incoming, 'gh-2', cache);

    expect(delivery.attempts.map((attempt) => attempt.ok)).toEqual([false, false, true]);
    expect(first).toMatchObject({ status: 'verified', deduplicated: false });
    expect(second).toMatchObject({ status: 'verified', deduplicated: true });
  });
});
