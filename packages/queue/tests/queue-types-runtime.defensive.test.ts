import { describe, expect, it } from 'vitest';
import {
  BULLMQ_MODES,
  JOB_STATES,
  isBullMQMode,
  isJobState,
} from '../src/types.js';

describe('queue/types runtime const', () => {
  it('BULLMQ_MODES exports testcontainers + sandbox', () => {
    expect(BULLMQ_MODES).toEqual(['testcontainers', 'sandbox']);
  });

  it('isBullMQMode accepts valid mode values', () => {
    expect(isBullMQMode('testcontainers')).toBe(true);
    expect(isBullMQMode('sandbox')).toBe(true);
  });

  it('isBullMQMode rejects invalid mode', () => {
    expect(isBullMQMode('production')).toBe(false);
    expect(isBullMQMode('')).toBe(false);
  });

  it('JOB_STATES exports the 5 BullMQ job states', () => {
    expect(JOB_STATES).toEqual([
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    ]);
  });

  it('isJobState accepts valid state values', () => {
    expect(isJobState('waiting')).toBe(true);
    expect(isJobState('completed')).toBe(true);
    expect(isJobState('delayed')).toBe(true);
  });

  it('isJobState rejects invalid state', () => {
    expect(isJobState('paused')).toBe(false);
    expect(isJobState('')).toBe(false);
  });
});
