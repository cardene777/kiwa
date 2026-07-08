import { describe, expect, it } from 'vitest';
import {
  runFullWorkflow,
  runIslandsArchitectureAxis,
  runProgressiveEnhancementAxis,
  runTurbopackHmrAxis,
} from '../src/workflow.js';

describe('Islands + Turbopack HMR + Progressive Enhancement workflow — 3 axis × 3 target', () => {
  it('islands-architecture axis verifies static boundary on all 3 targets', () => {
    const results = runIslandsArchitectureAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(4);
    }
  });

  it('turbopack-hmr axis completes fast-refresh on all 3 next targets', () => {
    const results = runTurbopackHmrAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('progressive-enhancement axis triggers on all 3 targets', () => {
    const results = runProgressiveEnhancementAxis();
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

  it('islands + hmr both emit non-zero events', () => {
    const iRes = runIslandsArchitectureAxis();
    const hRes = runTurbopackHmrAxis();
    for (const r of [...iRes, ...hRes]) {
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });
});
