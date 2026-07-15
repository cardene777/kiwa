/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createEmailClient, verifyWebhookSignature, parseDeliveryEvent } from '../../src/index.js';

const MODULE = 'email-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('email app scenario perf (real workload)', () => {
  it('3-layer perf: transactional_send_workflow / template_render_batch / webhook_verify_error', async () => {
    const secret = 'whsec_test';
    const templates = {
      welcome: '<h1>hello {{name}}</h1><p>plan: {{plan}}</p>',
      receipt: '<h1>receipt {{orderId}}</h1><p>amount: {{amount}}</p>',
    };

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
          name: 'transactional_send_workflow (10 send across 4 providers)',
          fn: async () => {
            const providers = ['resend', 'sendgrid', 'postmark', 'ses'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createEmailClient({ provider: providers[i % 4] });
              await client.send({ from: 'a@x', to: `u${i}@x`, subject: `Order ${i}`, text: `body ${i}` });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'template_render_batch (5 render with data)',
          fn: async () => {
            const client = createEmailClient({ provider: 'resend', templates });
            for (let i = 0; i < 5; i++) {
              await client.send({
                from: 'a@x',
                to: `u${i}@x`,
                subject: 'welcome',
                templateId: i % 2 === 0 ? 'welcome' : 'receipt',
                templateData: i % 2 === 0 ? { name: `user-${i}`, plan: 'pro' } : { orderId: `o-${i}`, amount: 100 * i },
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'webhook_verify_delivery_batch (5 verify + parse)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const payload = JSON.stringify({ type: 'email.delivered', email_id: `re-${i}`, timestamp: i, recipient: `u${i}@x` });
              const signature = createHmac('sha256', secret).update(payload).digest('hex');
              verifyWebhookSignature(payload, signature, secret, 'resend');
              parseDeliveryEvent({ provider: 'resend', raw: JSON.parse(payload) });
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
