import { afterEach, describe, expect, it } from 'vitest';
import {
  setupRabbitMQAdvancedEnv,
  type RabbitMQAdvancedTestEnv,
} from '@kiwa-lab/queue';
import {
  processWithDeadLetter,
  scheduleSmsReminder,
  verifyQuorumSurvivesNodeFailure,
} from '../src/prod-topology.js';

const envs: RabbitMQAdvancedTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeProdEnv(): Promise<RabbitMQAdvancedTestEnv<'mock'>> {
  const env = await setupRabbitMQAdvancedEnv({
    exchanges: [
      { name: 'dlx.work', type: 'direct' },
      { name: 'sms.outbox', type: 'direct' },
    ],
    delayedExchanges: [{ name: 'sms.delayed', type: 'x-delayed-message', delayedType: 'direct' }],
    queues: [
      {
        name: 'work.main',
        deadLetterExchange: 'dlx.work',
        deadLetterRoutingKey: 'work.failed',
        kind: 'quorum',
      },
      { name: 'work.triage' },
      { name: 'sms.outbox' },
    ],
    bindings: [
      { exchange: 'dlx.work', queue: 'work.triage', routingKey: 'work.failed' },
      { exchange: 'sms.outbox', queue: 'sms.outbox', routingKey: 'sms.reminder' },
      { exchange: 'sms.delayed', queue: 'sms.outbox', routingKey: 'sms.reminder' },
    ],
    cluster: {
      nodes: [
        { id: 'rabbit@node-1', role: 'primary', active: true },
        { id: 'rabbit@node-2', role: 'replica', active: true },
        { id: 'rabbit@node-3', role: 'replica', active: true },
      ],
    },
    federation: {
      upstreams: [{ name: 'upstream-eu', uri: 'amqp://eu-broker:5672' }],
      links: [{ upstreamName: 'upstream-eu', downstreamExchange: 'dlx.work' }],
    },
  });
  envs.push(env);
  return env;
}

describe('queue-rabbitmq-advanced PoC — dead-letter pipeline', () => {
  it('T-RMQ-ADV-POC-001 invalid payload is dead-lettered to the triage queue', async () => {
    const env = await makeProdEnv();
    const result = await processWithDeadLetter(env, {
      payload: { valid: false, body: 'bad-schema' },
    });
    expect(result.dlqDepth).toBe(1);
    const dl = await env.dlx.assertDeadLettered('work.main', { reason: 'rejected' });
    expect(dl.deadLetterExchange).toBe('dlx.work');
  });

  it('T-RMQ-ADV-POC-002 valid payload is acked and no dead-letter fires', async () => {
    const env = await makeProdEnv();
    const result = await processWithDeadLetter(env, {
      payload: { valid: true, body: 'ok' },
    });
    expect(result.dlqDepth).toBe(0);
    expect(env.dlx.listDeadLetters()).toHaveLength(0);
  });
});

describe('queue-rabbitmq-advanced PoC — delayed message scheduling', () => {
  it('T-RMQ-ADV-POC-003 SMS reminder is queued for the future then fires after clock advance', async () => {
    const env = await makeProdEnv();
    const result = await scheduleSmsReminder(env, {
      phone: '+15551234567',
      text: 'Reminder!',
      delayMs: 60000,
    });
    expect(result.scheduledBefore).toBe(0);
    expect(result.deliveredAfter).toBe(1);
  });

  it('T-RMQ-ADV-POC-004 multiple reminders fire in delay order', async () => {
    const env = await makeProdEnv();
    await env.delayed.publishDelayed({
      exchange: 'sms.delayed',
      routingKey: 'sms.reminder',
      body: { text: '10min' },
      delayMs: 600_000,
    });
    await env.delayed.publishDelayed({
      exchange: 'sms.delayed',
      routingKey: 'sms.reminder',
      body: { text: '1min' },
      delayMs: 60_000,
    });
    await env.delayed.advanceClock(120_000);
    expect(env.peek('sms.outbox')).toHaveLength(1);
    await env.delayed.advanceClock(600_000);
    expect(env.peek('sms.outbox')).toHaveLength(2);
  });
});

describe('queue-rabbitmq-advanced PoC — quorum queue node failure', () => {
  it('T-RMQ-ADV-POC-005 queue survives a single-node failure with 2/3 replicas', async () => {
    const env = await makeProdEnv();
    const result = verifyQuorumSurvivesNodeFailure(env, {
      failNodeId: 'rabbit@node-2',
      queueName: 'work.main',
    });
    expect(result.hostBefore).toMatch(/^rabbit@node-\d$/);
    expect(result.hostAfter).toMatch(/^rabbit@node-\d$/);
    expect(result.hostAfter).not.toBe('rabbit@node-2');
  });

  it('T-RMQ-ADV-POC-006 quorum queue rejects health check when only 1/3 replica remains', async () => {
    const env = await makeProdEnv();
    await env.cluster.stopNode('rabbit@node-2');
    await env.cluster.stopNode('rabbit@node-3');
    expect(() => env.cluster.assertQuorumHealthy('work.main')).toThrow(/3 active nodes/);
  });
});

describe('queue-rabbitmq-advanced PoC — federation', () => {
  it('T-RMQ-ADV-POC-007 upstream ingest lands on the downstream exchange', async () => {
    const env = await makeProdEnv();
    await env.federation.ingestFromUpstream({
      upstreamName: 'upstream-eu',
      exchange: 'dlx.work',
      routingKey: 'work.failed',
      body: 'from-eu',
    });
    expect(env.peek('work.triage')).toHaveLength(1);
  });
});

describe('queue-rabbitmq-advanced PoC — auto-reconnect backoff', () => {
  it('T-RMQ-ADV-POC-008 amqp-connection-manager style reconnect succeeds within maxAttempts', async () => {
    const env = await makeProdEnv();
    const result = await env.autoReconnect.simulateReconnect({ failAttempts: 3 });
    expect(result.succeeded).toBe(true);
    expect(result.attempts).toBe(4);
    // 100 + 200 + 400 = 700 (max 1000 not hit).
    expect(result.totalDelayMs).toBe(700);
  });
});
