/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNotificationClient } from '../../src/index.js';

const MODULE = 'notification-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('notification app scenario perf (real workload)', () => {
  it('3-layer perf: multi_channel_workflow / push_batch / sms_error_handling', async () => {
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
          name: 'multi_channel_workflow (10 dispatch push+sms+in-app across providers)',
          fn: async () => {
            const clients = [
              createNotificationClient({ pushProvider: 'fcm', smsProvider: 'twilio' }),
              createNotificationClient({ pushProvider: 'apns', smsProvider: 'sns' }),
            ];
            for (let i = 0; i < 10; i++) {
              const c = clients[i % 2]!;
              await c.dispatch(['push', 'sms', 'in-app'], {
                push: { deviceToken: `dev-${i}`, title: `notice ${i}`, body: `body ${i}` },
                sms: { to: `+1555${1000 + i}`, from: '+15559999', body: `sms body ${i}` },
                inApp: { userId: `u-${i}`, title: `t${i}`, body: `b${i}` },
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'push_batch (5 sendPush with high-priority payload)',
          fn: async () => {
            const client = createNotificationClient({ pushProvider: 'fcm' });
            for (let i = 0; i < 5; i++) {
              await client.sendPush({
                deviceToken: `dev-${i}`,
                title: `notice ${i}`,
                body: `body ${i}`,
                data: { url: `/x/${i}` },
                badge: i,
                sound: 'default',
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'sms_error_handling (5 failOn callback path)',
          fn: async () => {
            const client = createNotificationClient({
              smsProvider: 'twilio',
              failOn: (channel, msg) => channel === 'sms' && (msg as { to?: string }).to === '+15550000',
            });
            for (let i = 0; i < 5; i++) {
              const res = await client.sendSMS({ to: '+15550000', from: '+15559999', body: `blocked ${i}` });
              if (res.status !== 'failed') throw new Error(`expected failed, got ${res.status}`);
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
