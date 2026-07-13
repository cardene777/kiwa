import { describe, expect, it } from 'vitest';
import {
  ADAPTER_MODES,
  isAdapterMode,
} from '../src/adapters/types.js';

describe('mobile/adapters/types runtime helpers', () => {
  it('ADAPTER_MODES exposes mock + real', () => {
    expect([...ADAPTER_MODES]).toEqual(['mock', 'real']);
  });

  it('isAdapterMode round trip', () => {
    for (const m of ADAPTER_MODES) expect(isAdapterMode(m)).toBe(true);
    expect(isAdapterMode('bogus')).toBe(false);
    expect(isAdapterMode('')).toBe(false);
    expect(isAdapterMode(1)).toBe(false);
    expect(isAdapterMode(null)).toBe(false);
    expect(isAdapterMode(undefined)).toBe(false);
    expect(isAdapterMode({})).toBe(false);
  });
});
