import { describe, expect, it } from 'vitest';
import {
  runExpoAxis,
  runFullMobileWorkflow,
  runMetroAxis,
  runReactNativeAxis,
} from '../src/workflow.js';

describe('Mobile 3 axis × 3 target workflow (v1.50-2)', () => {
  it('react-native axis completes on ios/android/web', () => {
    const results = runReactNativeAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('expo axis completes on ios/android/web', () => {
    const results = runExpoAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('metro axis completes on ios/android/web', () => {
    const results = runMetroAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('runFullMobileWorkflow emits 9 results (3 axis × 3 target)', () => {
    const results = runFullMobileWorkflow();
    expect(results).toHaveLength(9);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('all 3 targets appear in RN axis', () => {
    const results = runReactNativeAxis();
    const targets = results.map((r) => r.target).sort();
    expect(targets).toEqual(['android', 'ios', 'web']);
  });

  it('all 3 targets appear in Expo axis', () => {
    const results = runExpoAxis();
    const targets = results.map((r) => r.target).sort();
    expect(targets).toEqual(['android', 'ios', 'web']);
  });

  it('all 3 targets appear in Metro axis', () => {
    const results = runMetroAxis();
    const targets = results.map((r) => r.target).sort();
    expect(targets).toEqual(['android', 'ios', 'web']);
  });

  it('unique axes in workflow', () => {
    const results = runFullMobileWorkflow();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(3);
  });

  it('event count for RN axis >= 4 (mount + invoke + gesture + unmount)', () => {
    const results = runReactNativeAxis();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('event count for Expo axis >= 4', () => {
    const results = runExpoAxis();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('event count for Metro axis >= 4', () => {
    const results = runMetroAxis();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });
});
