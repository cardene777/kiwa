import { describe, expect, it } from 'vitest';
import {
  COMPONENT_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type ComponentAxis,
} from '../../src/index.js';

describe('component fidelity coverage', () => {
  it('collects 3 targets x 4 axes', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['storybook8', 'playwright-ct', 'chromatic']);
    expect(coverage.axes).toHaveLength(4);
    expect(coverage.rows).toHaveLength(12);
  });

  it('maps every axis to four neutral events', () => {
    for (const events of Object.values(COMPONENT_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('keeps the combined 4-axis story in one grid', () => {
    const axes = Object.keys(COMPONENT_AXIS_TO_EVENTS) as ComponentAxis[];
    expect(axes).toEqual([
      'rsc-harness',
      'streaming-ssr',
      'view-transitions',
      'form-action-advanced',
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

  it('supports subset target collection', () => {
    const coverage = collectFidelityCoverage(['chromatic']);
    expect(coverage.rows).toHaveLength(4);
    expect(coverage.rows.every((row) => row.provider === 'chromatic')).toBe(true);
  });

  it('each row has matching neutral and provider event counts', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      expect(row.providerEvents).toHaveLength(row.neutralEvents.length);
    }
  });
});
