import { describe, expect, it } from 'vitest';
import {
  RABBITMQ_ADVANCED_QUEUE_KINDS,
  RABBITMQ_DELAYED_EXCHANGE_TYPE,
  isRabbitMQAdvancedQueueKind,
  isRabbitMQDelayedExchangeType,
} from '../src/rabbitmq-advanced/types.js';

describe('rabbitmq-advanced/types runtime helpers', () => {
  it('RABBITMQ_ADVANCED_QUEUE_KINDS exposes classic + quorum', () => {
    expect([...RABBITMQ_ADVANCED_QUEUE_KINDS]).toEqual(['classic', 'quorum']);
  });

  it('isRabbitMQAdvancedQueueKind accepts classic + quorum', () => {
    expect(isRabbitMQAdvancedQueueKind('classic')).toBe(true);
    expect(isRabbitMQAdvancedQueueKind('quorum')).toBe(true);
  });

  it('isRabbitMQAdvancedQueueKind rejects unknown strings + non-strings', () => {
    expect(isRabbitMQAdvancedQueueKind('mirror')).toBe(false);
    expect(isRabbitMQAdvancedQueueKind('')).toBe(false);
    expect(isRabbitMQAdvancedQueueKind(42)).toBe(false);
    expect(isRabbitMQAdvancedQueueKind(null)).toBe(false);
    expect(isRabbitMQAdvancedQueueKind(undefined)).toBe(false);
    expect(isRabbitMQAdvancedQueueKind({})).toBe(false);
  });

  it('RABBITMQ_DELAYED_EXCHANGE_TYPE is the x-delayed-message sentinel', () => {
    expect(RABBITMQ_DELAYED_EXCHANGE_TYPE).toBe('x-delayed-message');
  });

  it('isRabbitMQDelayedExchangeType accepts the sentinel + rejects everything else', () => {
    expect(isRabbitMQDelayedExchangeType('x-delayed-message')).toBe(true);
    expect(isRabbitMQDelayedExchangeType('direct')).toBe(false);
    expect(isRabbitMQDelayedExchangeType('topic')).toBe(false);
    expect(isRabbitMQDelayedExchangeType(null)).toBe(false);
    expect(isRabbitMQDelayedExchangeType(undefined)).toBe(false);
  });
});
