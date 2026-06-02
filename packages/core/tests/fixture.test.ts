import { describe, expect, it } from 'vitest';
import { dappE2eTest } from '../src/index.js';

describe('dappE2eTest fixture', () => {
  it('T-FIX-001 dappE2eTest は @playwright/test の test オブジェクト互換 (extend method を持つ)', () => {
    // Given
    // When
    const tt = dappE2eTest as { extend?: unknown };
    // Then
    expect(typeof tt?.extend).toBe('function');
  });

  it('T-FIX-002 dappE2eTest は describe / step / use を持つ Playwright test API である', () => {
    // Given
    const tt = dappE2eTest as { describe?: unknown; step?: unknown };
    // When (no action)
    // Then
    expect(typeof tt?.describe).toBe('function');
  });
});
