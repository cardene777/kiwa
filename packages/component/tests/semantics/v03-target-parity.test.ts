import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  providerEventName,
  type ComponentAxis,
  type ComponentTarget,
} from '../../src/index.js';

const AXES: ComponentAxis[] = [
  'rsc-harness',
  'streaming-ssr',
  'view-transitions',
  'form-action-advanced',
];
const TARGETS: ComponentTarget[] = ['storybook8', 'playwright-ct', 'chromatic'];

describe('v0.3 component target parity', () => {
  const coverage = collectFidelityCoverage();

  for (const provider of TARGETS) {
    for (const axis of AXES) {
      it(`${provider} x ${axis}: has non-empty provider events`, () => {
        const row = coverage.rows.find((r) => r.provider === provider && r.axis === axis);
        expect(row).toBeDefined();
        for (const event of row?.providerEvents ?? []) {
          expect(event.length).toBeGreaterThan(0);
          expect(event).not.toMatch(/^(rsc|ssr|transition|form)\./);
        }
      });
    }
  }

  it('rsc stream chunk differs by all targets', () => {
    expect(providerEventName('storybook8', 'rsc.html_chunk_streamed')).toBe(
      'storybook.stream.chunk',
    );
    expect(providerEventName('playwright-ct', 'rsc.html_chunk_streamed')).toBe(
      'pwct.response.chunk',
    );
    expect(providerEventName('chromatic', 'rsc.html_chunk_streamed')).toBe(
      'chromatic.capture.chunk',
    );
  });

  it('view animation maps to chromatic animation assert', () => {
    expect(providerEventName('chromatic', 'transition.animation_asserted')).toBe(
      'chromatic.animation.assert',
    );
  });
});
