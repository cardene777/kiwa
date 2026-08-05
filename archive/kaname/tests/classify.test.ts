import { describe, expect, it } from 'vitest';
import { classify } from '../src/classify.js';
import type { SpecDoc } from '../src/types.js';

const OK_DOC: SpecDoc = {
  title: 'Session lifecycle',
  items: [
    {
      id: 'AC-001',
      statement: 'session state machine follows the documented transitions',
      layer: 'formal',
      verifyBy: 'Session',
    },
    {
      id: 'AC-002',
      statement: 'refresh token rotation is persisted to storage',
      layer: 'runtime',
      verifyBy: 'tests/integration/refresh-rotation.test.ts',
    },
    {
      id: 'AC-003',
      statement: 'the login screen is legible for a first-time user',
      layer: 'human',
      verifyBy: 'UX walkthrough',
    },
  ],
};

describe('classify', () => {
  it('T-SK-C-001 returns ok=true on a well-formed doc', () => {
    const report = classify(OK_DOC);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.perLayer).toEqual({ formal: 1, runtime: 1, human: 1 });
  });

  it('T-SK-C-002 flags duplicate item ids', () => {
    const bad: SpecDoc = {
      ...OK_DOC,
      items: [OK_DOC.items[0]!, { ...OK_DOC.items[1]!, id: 'AC-001' }],
    };
    const report = classify(bad);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.reason === 'duplicate-id')).toBe(true);
  });

  it('T-SK-C-003 flags empty statement', () => {
    const bad: SpecDoc = {
      ...OK_DOC,
      items: [{ ...OK_DOC.items[0]!, statement: '   ' }],
    };
    const report = classify(bad);
    expect(report.issues.some((i) => i.reason === 'empty-statement')).toBe(true);
  });

  it('T-SK-C-004 flags empty verifyBy', () => {
    const bad: SpecDoc = {
      ...OK_DOC,
      items: [{ ...OK_DOC.items[0]!, verifyBy: '' }],
    };
    const report = classify(bad);
    expect(report.issues.some((i) => i.reason === 'empty-verify-by')).toBe(true);
  });

  it('T-SK-C-005 flags unknown layer', () => {
    const bad: SpecDoc = {
      ...OK_DOC,
      items: [
        {
          ...OK_DOC.items[0]!,
          // deliberately bypassing the type to simulate an authoring bug
          layer: 'formalish' as unknown as 'formal',
        },
      ],
    };
    const report = classify(bad);
    expect(report.issues.some((i) => i.reason === 'unknown-layer')).toBe(true);
  });

  it('T-SK-C-006 flags the same verifyBy target claimed by two layers', () => {
    const bad: SpecDoc = {
      ...OK_DOC,
      items: [
        {
          id: 'AC-001',
          statement: 'state machine correct',
          layer: 'formal',
          verifyBy: 'tests/integration/session.test.ts',
        },
        {
          id: 'AC-002',
          statement: 'runtime integration works',
          layer: 'runtime',
          verifyBy: 'tests/integration/session.test.ts',
        },
      ],
    };
    const report = classify(bad);
    expect(report.issues.some((i) => i.reason === 'both-layers-touch-same-artifact')).toBe(true);
  });

  it('T-SK-C-007 counts perLayer independent of ok/issues', () => {
    const report = classify(OK_DOC);
    expect(report.perLayer.formal).toBe(1);
    expect(report.perLayer.runtime).toBe(1);
    expect(report.perLayer.human).toBe(1);
  });
});
