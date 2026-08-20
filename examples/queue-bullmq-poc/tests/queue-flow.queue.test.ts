import { afterEach, describe, expect, it } from 'vitest';
import { setupBullMQEnv, type BullMQTestEnv } from '@kiwa-lab/queue';
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
    const recipients = ['c@example.test', 'a@example.test', 'b@example.test'];
    for (const to of recipients) {
      // eslint-disable-next-line no-await-in-loop
      await env.addJob<EmailBody>('send-email', { to, subject: 'Batch', body: 'Hi.' });
    }
    await env.assertQueueDrained();
    expect(sink.sent.map((email) => email.to).sort((a, b) => a.localeCompare(b, 'en'))).toEqual(
      [...recipients].sort((a, b) => a.localeCompare(b, 'en')),
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

describe('queue PoC — processor の返り値', () => {
  it('T-QUEUE-POC-009 returns the registered processor so it can be called directly', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    const processor = registerEmailProcessor(env, sink);
    const result = await processor({
      id: 'direct',
      name: 'send-email',
      data: { to: 'frank@example.test', subject: 'Direct', body: 'No queue.' },
      attemptsMade: 0,
      state: 'active',
    } as never);
    expect(result).toEqual({ id: 'email-1', to: 'frank@example.test' });
    expect(sink.sent.length).toBe(1);
  });
});

describe('queue PoC — sink の id の作られ方', () => {
  it('T-QUEUE-POC-010 numbers the id by successes, not by call count', async () => {
    // 2 回失敗して 3 回目に成功しても id は email-1。 queue を経由すると retry の
    // 実装が呼出回数に関与するため、sink を直接呼んで id の作り方だけを切り出す。
    const sink = createEmailSink({ failFirst: 2 });
    const email: EmailBody = { to: 'grace@example.test', subject: 'Id', body: 'Count.' };
    await expect(sink.send(email)).rejects.toThrow(/transient SMTP failure 1\/2/);
    await expect(sink.send(email)).rejects.toThrow(/transient SMTP failure 2\/2/);
    expect(await sink.send(email)).toEqual({ id: 'email-1', to: 'grace@example.test' });
    expect(sink.sent.length).toBe(1);
  });
});

describe('queue PoC — 同じ jobId の二重投入', () => {
  it('T-QUEUE-POC-011 replaces the earlier payload when the same jobId is reused', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    await env.addJob<EmailBody>(
      'send-email',
      { to: 'first@example.test', subject: 'Dup', body: 'First.' },
      { jobId: 'dup' },
    );
    await env.addJob<EmailBody>(
      'send-email',
      { to: 'second@example.test', subject: 'Dup', body: 'Second.' },
      { jobId: 'dup' },
    );
    await env.assertQueueDrained();
    expect(env.listJobs().length).toBe(1);
    expect(sink.sent.map((email) => email.to)).toEqual(['second@example.test']);
  });
});

describe('queue PoC — attempts の既定', () => {
  it('T-QUEUE-POC-012 gives up after a single attempt when attempts is omitted', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink({ failFirst: 1 });
    registerEmailProcessor(env, sink);
    await env.addJob<EmailBody>('send-email', {
      to: 'henry@example.test',
      subject: 'Once',
      body: 'One shot.',
    });
    const snap = await env.assertFailed<EmailBody>('send-email', {
      reasonMatch: /transient SMTP failure 1\/1/,
    });
    expect(snap.attemptsMade).toBe(1);
    expect(sink.sent).toEqual([]);
  });
});

describe('queue PoC — processor 未登録', () => {
  it('T-QUEUE-POC-013 never processes a job when no processor is registered', async () => {
    // T-QUEUE-POC-008 は投入していない job 名を待つ形。 こちらは投入したが
    // processor が無い形で、**どちらも同じ timeout で失敗する** ことを固定する。
    const env = await setupBullMQEnv();
    envs.push(env);
    await env.addJob<EmailBody>('send-email', {
      to: 'ida@example.test',
      subject: 'Orphan',
      body: 'Nobody listens.',
    });
    await expect(env.waitForJob('send-email', { timeoutMs: 50 })).rejects.toThrow(
      /timeout waiting/,
    );
  });
});

describe('queue PoC — 一覧', () => {
  it('T-QUEUE-POC-014 lists the completed snapshot with data and return value', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    const sink = createEmailSink();
    registerEmailProcessor(env, sink);
    const email: EmailBody = { to: 'jane@example.test', subject: 'List', body: 'Snapshot.' };
    await env.addJob<EmailBody>('send-email', email, { jobId: 'j1' });
    await env.assertQueueDrained();
    const jobs = env.listJobs();
    expect(jobs).toEqual([
      {
        id: 'j1',
        name: 'send-email',
        data: email,
        state: 'completed',
        attemptsMade: 1,
        returnValue: { id: 'email-1', to: 'jane@example.test' },
      },
    ]);
  });
});

describe('queue PoC — 投入時の引数の検証', () => {
  it('T-QUEUE-POC-015 refuses fewer than one attempt', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await expect(
      env.addJob<EmailBody>(
        'send-email',
        { to: 'kate@example.test', subject: 'Zero', body: 'No attempts.' },
        { attempts: 0 },
      ),
    ).rejects.toThrow(/addJob: attempts must be at least 1/);
  });

  it('T-QUEUE-POC-016 refuses a negative delay', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await expect(
      env.addJob<EmailBody>(
        'send-email',
        { to: 'liam@example.test', subject: 'Past', body: 'Negative.' },
        { delay: -1 },
      ),
    ).rejects.toThrow(/addJob: delay must be non-negative/);
  });
});
