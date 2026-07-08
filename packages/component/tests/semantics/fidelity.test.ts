import { describe, expect, it } from 'vitest';
import {
  COMPONENT_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type ComponentAxis,
} from '../../src/index.js';

describe('component fidelity coverage', () => {
  it('collects 3 targets x 6 axes (v1.49 advanced III pair 3 段拡張)', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['storybook8', 'playwright-ct', 'chromatic']);
    expect(coverage.axes).toHaveLength(6);
    expect(coverage.rows).toHaveLength(18);
  });

  it('maps every axis to four neutral events', () => {
    for (const events of Object.values(COMPONENT_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('keeps the combined 6-axis story in one grid (v1.49)', () => {
    const axes = Object.keys(COMPONENT_AXIS_TO_EVENTS) as ComponentAxis[];
    expect(axes).toEqual([
      'rsc-harness',
      'streaming-ssr',
      'view-transitions',
      'form-action-advanced',
      'react-19-actions',
      'islands-architecture',
    ]);
  });

  it('translates at least two target dialects differently', () => {
    expect(providerEventName('storybook8', 'form.progressive_enhanced')).toBe(
      'storybook.form.enhanced',
    );
    expect(providerEventName('playwright-ct', 'form.progressive_enhanced')).toBe(
      'pwct.form.enhanced',
    );
  });

  it('supports subset target collection (6 axis v1.49)', () => {
    const coverage = collectFidelityCoverage(['chromatic']);
    expect(coverage.rows).toHaveLength(6);
    expect(coverage.rows.every((row) => row.provider === 'chromatic')).toBe(true);
  });

  it('each row has matching neutral and provider event counts', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      expect(row.providerEvents).toHaveLength(row.neutralEvents.length);
    }
  });
});
