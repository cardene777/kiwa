/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createWebhookVerifier,
  verifyWebhookSignature,
  parseWebhookPayload,
  dispatchWithRetry,
} from '../../src/index.js';

const MODULE = 'webhook-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('webhook app scenario perf (real workload)', () => {
  it('3-layer perf: verify_workflow / dispatch_retry_batch / signature_reject_error', async () => {
    const secret = 'whsec_test';
    const providers = ['stripe', 'github', 'slack', 'twilio'] as const;
    const noopSleep = async (_ms: number) => { /* zero delay for perf loop */ };

    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'verify_workflow (10 verify across 4 providers)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const provider = providers[i % 4]!;
              const verifier = createWebhookVerifier({ provider, secret });
              const payload = JSON.stringify(sampleBody(provider, i));
              const signature = buildSignature(provider, payload, secret);
              verifier.verify({ payload, signature });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'dispatch_retry_batch (5 handler retry with backoff)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              let attempts = 0;
              const handler = async () => {
                attempts += 1;
                if (attempts < 2) throw new Error('transient');
              };
              await dispatchWithRetry(
                handler,
                { type: 'payment.succeeded', provider: 'stripe', eventId: `evt_${i}`, occurredAt: i },
                { sleep: noopSleep, maxAttempts: 3, initialDelayMs: 1 },
              );
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'signature_reject_error (5 invalid signature detect)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const provider = providers[i % 4]!;
              const payload = JSON.stringify(sampleBody(provider, i));
              verifyWebhookSignature(payload, 'garbage', secret, provider);
              parseWebhookPayload({ provider, raw: sampleBody(provider, i) });
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});

function sampleBody(provider: 'stripe' | 'github' | 'slack' | 'twilio', i: number): Record<string, unknown> {
  if (provider === 'stripe') {
    return { type: 'payment_intent.succeeded', id: `evt_${i}`, created: i, data: { object: { id: `pi_${i}` } } };
  }
  if (provider === 'github') {
    return { event: 'push', delivery: `gh_${i}`, timestamp: i, repository: { full_name: `owner/repo${i}` } };
  }
  if (provider === 'slack') {
    return { event_id: `Ev${i}`, event: { type: 'message', channel: `C${i}` }, event_time: i };
  }
  return { MessageSid: `SM${i}`, MessageStatus: 'delivered', To: `+1555000000${i}`, Timestamp: i };
}

function buildSignature(provider: 'stripe' | 'github' | 'slack' | 'twilio', payload: string, secret: string): string {
  if (provider === 'stripe') {
    const ts = '0';
    const base = `${ts}.${payload}`;
    const v1 = createHmac('sha256', secret).update(base).digest('hex');
    return `t=${ts},v1=${v1}`;
  }
  if (provider === 'github') {
    return `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
  }
  if (provider === 'slack') {
    return `v0=${createHmac('sha256', secret).update(`v0:${payload}`).digest('hex')}`;
  }
  return createHmac('sha1', secret).update(payload).digest('base64');
}
