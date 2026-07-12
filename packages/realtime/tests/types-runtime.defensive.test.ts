import { describe, expect, it } from 'vitest';
import { CONNECTION_STATES, isConnectionState } from '../src/types.js';

describe('realtime/types runtime const', () => {
  it('CONNECTION_STATES exports 5-element tuple', () => {
    expect(CONNECTION_STATES).toEqual([
      'disconnected',
      'connecting',
      'connected',
      'reconnecting',
      'closed',
    ]);
  });

  it('isConnectionState returns true for valid state', () => {
    expect(isConnectionState('connected')).toBe(true);
    expect(isConnectionState('disconnected')).toBe(true);
    expect(isConnectionState('closed')).toBe(true);
  });

  it('isConnectionState returns false for unknown value', () => {
    expect(isConnectionState('unknown')).toBe(false);
    expect(isConnectionState('')).toBe(false);
  });
});
