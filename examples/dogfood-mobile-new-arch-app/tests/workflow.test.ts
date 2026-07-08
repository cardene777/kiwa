import { describe, expect, it } from 'vitest';
import {
  runCodegenAxis,
  runFabricAxis,
  runFullNewArchWorkflow,
  runNewArchitectureAxis,
  runTurboModulesAxis,
} from '../src/workflow.js';

describe('Mobile New Architecture 4 axis × 3 target workflow (v1.52-2)', () => {
  it('fabric axis mounts on ios/android/web', () => {
    const results = runFabricAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('turbo-modules axis unregisters on ios/android/web', () => {
    const results = runTurboModulesAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('codegen axis builds on ios/android/web', () => {
    const results = runCodegenAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('new-architecture axis reaches ready on all 3 targets', () => {
    const results = runNewArchitectureAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('runFullNewArchWorkflow emits 12 results (4 axis × 3 target)', () => {
    const results = runFullNewArchWorkflow();
    expect(results).toHaveLength(12);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('unique 4 axes in workflow', () => {
    const results = runFullNewArchWorkflow();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(4);
  });

  it('all 3 targets present in each axis', () => {
    for (const runner of [runFabricAxis, runTurboModulesAxis, runCodegenAxis, runNewArchitectureAxis]) {
      const targets = runner().map((r) => r.target).sort();
      expect(targets).toEqual(['android', 'ios', 'web']);
    }
  });

  it('each axis event count >= 3 (min transitions)', () => {
    const results = runFullNewArchWorkflow();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThanOrEqual(3);
    }
  });
});
