import { describe, expect, it } from 'vitest';
import {
  runConcurrentTransitionsAxis,
  runFullWorkflow,
  runPartialPrerenderingAxis,
  runViewTransitionsAxis,
} from '../src/workflow.js';

describe('View Transitions + Concurrent React workflow — 3 axis × 3 target', () => {
  it('view-transitions axis emits events on all 3 targets', () => {
    const results = runViewTransitionsAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('concurrent-transitions axis commits on all 3 next targets', () => {
    const results = runConcurrentTransitionsAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('partial-prerendering axis completes on all 3 next targets', () => {
    const results = runPartialPrerenderingAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('runFullWorkflow emits 9 results (3 axis × 3 target)', () => {
    const results = runFullWorkflow();
    expect(results).toHaveLength(9);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('unique axis names in workflow', () => {
    const results = runFullWorkflow();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(3);
  });

  it('concurrent-transitions records interrupts', () => {
    const results = runConcurrentTransitionsAxis();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThan(3);
    }
  });
});
