import { afterEach, describe, expect, it } from 'vitest';
import { setupBullMQEnv, type BullMQTestEnv } from '@kiwa-test/queue';
import { createEmailSink, registerEmailProcessor, type EmailBody } from '../src/email-worker.js';

const envs: BullMQTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('queue PoC — sandbox happy path', () => {
  it('T-QUEUE-POC-001 sends a confirmation email through the queue', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    await env.addJob<EmailBody>('send-email', {
      to: 'alice@example.test',
      subject: 'Welcome to kiwa',
      body: 'Your account is ready.',
    });
    const snap = await env.assertProcessed<EmailBody, { id: string; to: string }>(
      'send-email',
      { returnValue: { id: 'email-1', to: 'alice@example.test' } },
    );
    expect(sink.sent.length).toBe(1);
    expect(snap.state).toBe('completed');
  });
});

describe('queue PoC — retry semantics', () => {
  it('T-QUEUE-POC-002 retries the send when the sink throws twice', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink({ failFirst: 2 });
    registerEmailProcessor(env, sink);
    await env.addJob<EmailBody>(
      'send-email',
      { to: 'bob@example.test', subject: 'Retry', body: 'Third time is the charm.' },
      { attempts: 3 },
    );
    const snap = await env.assertProcessed<EmailBody, { id: string; to: string }>('send-email');
    expect(snap.attemptsMade).toBe(3);
    expect(sink.sent.length).toBe(1);
  });

  it('T-QUEUE-POC-003 fails when attempts are exhausted', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink({ failFirst: 5 });
    registerEmailProcessor(env, sink);
    await env.addJob<EmailBody>(
      'send-email',
      { to: 'carol@example.test', subject: 'Fail', body: 'Never lands.' },
      { attempts: 2 },
    );
    const snap = await env.assertFailed<EmailBody>('send-email', {
      retry: 2,
      reasonMatch: /transient SMTP/,
    });
    expect(sink.sent).toEqual([]);
    expect(snap.attemptsMade).toBe(2);
  });
});

describe('queue PoC — drained + introspection', () => {
  it('T-QUEUE-POC-004 batches three jobs and drains the queue', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    const recipients = ['a@example.test', 'b@example.test', 'c@example.test'];
    for (const to of recipients) {
      // eslint-disable-next-line no-await-in-loop
      await env.addJob<EmailBody>('send-email', { to, subject: 'Batch', body: 'Hi.' });
    }
    await env.assertQueueDrained();
    expect(sink.sent.map((email) => email.to).sort((a, b) => a.localeCompare(b, 'en'))).toEqual(
      recipients,
    );
  });
});

describe('queue PoC — delayed dispatch', () => {
  it('T-QUEUE-POC-005 respects a scheduled delay before running the send', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    const enqueuedAt = Date.now();
    await env.addJob<EmailBody>(
      'send-email',
      { to: 'delayed@example.test', subject: 'Later', body: 'Wait.' },
      { delay: 30 },
    );
    await env.assertProcessed('send-email');
    expect(Date.now() - enqueuedAt).toBeGreaterThanOrEqual(25);
    expect(sink.sent.length).toBe(1);
  });
});

describe('queue PoC — options + jobId', () => {
  it('T-QUEUE-POC-006 uses a deterministic jobId for idempotency assertions', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    const snap = await env.addJob<EmailBody>(
      'send-email',
      { to: 'dave@example.test', subject: 'ID', body: 'Deterministic.' },
      { jobId: 'welcome-dave' },
    );
    expect(snap.id).toBe('welcome-dave');
    await env.assertProcessed('send-email');
  });
});

describe('queue PoC — stop cleanup', () => {
  it('T-QUEUE-POC-007 stop() invalidates addJob for follow-up work', async () => {
    const env = await setupBullMQEnv();
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    await env.addJob<EmailBody>('send-email', {
      to: 'eve@example.test',
      subject: 'Stop',
      body: 'Bye.',
    });
    await env.assertProcessed('send-email');
    await env.stop();
    await expect(
      env.addJob<EmailBody>('send-email', {
        to: 'ghost@example.test',
        subject: 'X',
        body: 'X',
      }),
    ).rejects.toThrow(/after stop/);
  });
});

describe('queue PoC — waitForJob timeout guard', () => {
  it('T-QUEUE-POC-008 waitForJob rejects when a matching job never arrives', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await expect(env.waitForJob('nothing-here', { timeoutMs: 20 })).rejects.toThrow(
      /timeout waiting/,
    );
  });
});
