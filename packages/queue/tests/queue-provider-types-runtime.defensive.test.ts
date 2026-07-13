import { describe, expect, it } from 'vitest';
import {
  CLOUDFLARE_QUEUES_MODES,
  isCloudflareQueuesMode,
} from '../src/cloudflare-queues/types.js';
import { INNGEST_MODES, isInngestMode } from '../src/inngest/types.js';
import { RABBITMQ_MODES, isRabbitMQMode } from '../src/rabbitmq/types.js';
import { SQS_MODES, isSQSMode } from '../src/sqs/types.js';

describe('queue provider types runtime const batch', () => {
  it('CloudflareQueuesMode has miniflare + wrangler', () => {
    expect(CLOUDFLARE_QUEUES_MODES).toEqual(['miniflare', 'wrangler']);
    expect(isCloudflareQueuesMode('miniflare')).toBe(true);
    expect(isCloudflareQueuesMode('wrangler')).toBe(true);
    expect(isCloudflareQueuesMode('unknown')).toBe(false);
  });

  it('InngestMode has stub + dev-server', () => {
    expect(INNGEST_MODES).toEqual(['stub', 'dev-server']);
    expect(isInngestMode('stub')).toBe(true);
    expect(isInngestMode('dev-server')).toBe(true);
    expect(isInngestMode('unknown')).toBe(false);
  });

  it('RabbitMQMode has stub + testcontainers', () => {
    expect(RABBITMQ_MODES).toEqual(['stub', 'testcontainers']);
    expect(isRabbitMQMode('stub')).toBe(true);
    expect(isRabbitMQMode('testcontainers')).toBe(true);
    expect(isRabbitMQMode('unknown')).toBe(false);
  });

  it('SQSMode has stub + localstack', () => {
    expect(SQS_MODES).toEqual(['stub', 'localstack']);
    expect(isSQSMode('stub')).toBe(true);
    expect(isSQSMode('localstack')).toBe(true);
    expect(isSQSMode('unknown')).toBe(false);
  });
});
