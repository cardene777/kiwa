import { describe, expect, it } from 'vitest';
import {
  runFullWorkflow,
  runReactActionsAxis,
  runRscHarnessAxis,
  runServerActionAdvancedAxis,
} from '../src/workflow.js';

describe('RSC + Server Actions v2 workflow — 3 axis × 3 target', () => {
  it('rsc-harness axis completes on all 3 targets', () => {
    const results = runRscHarnessAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('react-19-actions axis completes on all 3 targets', () => {
    const results = runReactActionsAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('server-action-advanced axis completes on all 3 targets', () => {
    const results = runServerActionAdvancedAxis();
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

  it('all 3 component targets appear in rsc-harness rows', () => {
    const results = runRscHarnessAxis();
    const targets = results.map((r) => r.target).sort();
    expect(targets).toEqual(['chromatic', 'playwright-ct', 'storybook8']);
  });

  it('all 3 next targets appear in server-action rows', () => {
    const results = runServerActionAdvancedAxis();
    const targets = results.map((r) => r.target).sort();
    expect(targets).toEqual(['app-router', 'edge-runtime', 'pages-router']);
  });

  it('event counts non-negative', () => {
    const results = runFullWorkflow();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThanOrEqual(1);
    }
  });
});
