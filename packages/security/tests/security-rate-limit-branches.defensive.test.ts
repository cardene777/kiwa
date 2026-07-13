import { describe, expect, it } from 'vitest';
import { SlidingWindow } from '../src/rate-limit.js';
import { versionInRange } from '../src/sbom.js';

describe('SlidingWindow defensive branches', () => {
  it('first record on empty window is allowed', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 5 });
    const result = win.record(1000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('rejects when window is full (all timestamps within window)', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 2 });
    win.record(1000);
    win.record(1500);
    const denied = win.record(1600);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.reason).toContain('rate exceeded');
  });

  it('re-allows after old timestamps drop out of window', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 2 });
    win.record(1000);
    win.record(1500);
    // Advance past window
    const later = win.record(2600);
    expect(later.allowed).toBe(true);
  });

  it('resetAtMs uses nowMs when timestamps empty (?? fallback)', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 5 });
    const result = win.record(5000);
    expect(result.resetAtMs).toBeGreaterThanOrEqual(5000);
  });
});

describe('versionInRange defensive branches', () => {
  it('matches exact version equality', () => {
    expect(versionInRange('1.2.3', '1.2.3')).toBe(true);
  });

  it('handles >= operator', () => {
    expect(versionInRange('2.0.0', '>= 1.0.0')).toBe(true);
    expect(versionInRange('0.5.0', '>= 1.0.0')).toBe(false);
  });

  it('handles <= operator', () => {
    expect(versionInRange('1.0.0', '<= 2.0.0')).toBe(true);
    expect(versionInRange('3.0.0', '<= 2.0.0')).toBe(false);
  });

  it('handles > operator', () => {
    expect(versionInRange('2.0.0', '> 1.0.0')).toBe(true);
    expect(versionInRange('1.0.0', '> 1.0.0')).toBe(false);
  });

  it('handles < operator', () => {
    expect(versionInRange('0.5.0', '< 1.0.0')).toBe(true);
    expect(versionInRange('1.0.0', '< 1.0.0')).toBe(false);
  });

  it('handles = operator', () => {
    expect(versionInRange('1.0.0', '= 1.0.0')).toBe(true);
    expect(versionInRange('2.0.0', '= 1.0.0')).toBe(false);
  });

  it('range with unparseable clause falls back to string equality', () => {
    expect(versionInRange('main', 'main')).toBe(true);
    expect(versionInRange('main', 'develop')).toBe(false);
  });
});
