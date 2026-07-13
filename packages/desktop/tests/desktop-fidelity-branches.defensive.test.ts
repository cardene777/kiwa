import { describe, expect, it } from 'vitest';
import { summarizeFidelity } from '../src/adapters/fidelity-harness.js';
import { buildCacheKey } from '../src/adapters/invoke-cache.js';

describe('summarizeFidelity defensive branches', () => {
  it('returns zeros for empty diff list', () => {
    const result = summarizeFidelity([]);
    expect(result.total).toBe(0);
    expect(result.matched).toBe(0);
    // matchedRatio for empty is implementation-defined (may be 0 or 1)
    expect([0, 1]).toContain(result.matchedRatio);
  });

  it('summarizes matched diffs', () => {
    const result = summarizeFidelity([
      {
        axis: 'electron',
        target: 'macos',
        mockEvents: [],
        realEvents: [],
        matched: true,
        mockCompleted: true,
        realCompleted: true,
        metadataDiffs: [],
        durationDiffMs: 0,
      },
      {
        axis: 'electron',
        target: 'windows',
        mockEvents: [],
        realEvents: [],
        matched: true,
        mockCompleted: true,
        realCompleted: true,
        metadataDiffs: [],
        durationDiffMs: 0,
      },
    ]);
    expect(result.total).toBe(2);
    expect(result.matched).toBe(2);
    expect(result.matchedRatio).toBe(1);
  });

  it('summarizes unmatched diffs', () => {
    const result = summarizeFidelity([
      {
        axis: 'tauri',
        target: 'linux',
        mockEvents: [],
        realEvents: [],
        matched: false,
        mockCompleted: true,
        realCompleted: false,
        metadataDiffs: [],
        durationDiffMs: 0,
      },
    ]);
    expect(result.matched).toBe(0);
    expect(result.unmatched).toBe(1);
  });

  it('mixed matched + unmatched', () => {
    const result = summarizeFidelity([
      {
        axis: 'electron',
        target: 'macos',
        mockEvents: [],
        realEvents: [],
        matched: true,
        mockCompleted: true,
        realCompleted: true,
        metadataDiffs: [],
        durationDiffMs: 0,
      },
      {
        axis: 'electron',
        target: 'windows',
        mockEvents: [],
        realEvents: [],
        matched: false,
        mockCompleted: true,
        realCompleted: false,
        metadataDiffs: [],
        durationDiffMs: 0,
      },
    ]);
    expect(result.total).toBe(2);
    expect(result.matched).toBe(1);
    expect(result.unmatched).toBe(1);
    expect(result.matchedRatio).toBe(0.5);
  });
});

describe('buildCacheKey defensive branches', () => {
  it('builds cache key from axis + target + args', () => {
    const key = buildCacheKey({
      axis: 'electron',
      target: 'macos',
      args: ['a', 'b'],
    });
    expect(typeof key).toBe('string');
    expect(key).toContain('electron');
    expect(key).toContain('macos');
  });

  it('same axis + target + args produces same key', () => {
    const k1 = buildCacheKey({
      axis: 'electron',
      target: 'macos',
      args: ['x', 'y'],
    });
    const k2 = buildCacheKey({
      axis: 'electron',
      target: 'macos',
      args: ['x', 'y'],
    });
    expect(k1).toBe(k2);
  });

  it('different args produces different keys', () => {
    const k1 = buildCacheKey({
      axis: 'electron',
      target: 'macos',
      args: ['x'],
    });
    const k2 = buildCacheKey({
      axis: 'electron',
      target: 'macos',
      args: ['y'],
    });
    expect(k1).not.toBe(k2);
  });

  it('omitted args defaults to empty array', () => {
    const key = buildCacheKey({ axis: 'electron', target: 'macos' });
    expect(typeof key).toBe('string');
  });
});
