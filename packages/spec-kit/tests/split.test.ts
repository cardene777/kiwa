import { describe, expect, it } from 'vitest';
import { splitSpec } from '../src/split.js';
import type { SpecDoc } from '../src/types.js';

const DOC: SpecDoc = {
  title: 'Session lifecycle',
  issueRef: 'CAR-100',
  items: [
    {
      id: 'AC-001',
      statement: 'session state machine follows the documented transitions',
      layer: 'formal',
      verifyBy: 'Session',
      notes: 'Uses `@kiwa-lab/lean` with the Session orchestrator spec.',
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

describe('splitSpec', () => {
  it('T-SK-S-001 emits specFormal with only formal items', () => {
    const out = splitSpec(DOC);
    expect(out.specFormal).toContain('# Session lifecycle');
    expect(out.specFormal).toContain('> Ref: CAR-100');
    expect(out.specFormal).toContain('AC-001');
    expect(out.specFormal).not.toContain('AC-002');
    expect(out.specFormal).not.toContain('AC-003');
  });

  it('T-SK-S-002 emits specRuntime with runtime + human items', () => {
    const out = splitSpec(DOC);
    expect(out.specRuntime).toContain('AC-002');
    expect(out.specRuntime).toContain('AC-003');
    expect(out.specRuntime).not.toContain('AC-001');
  });

  it('T-SK-S-003 includes the layer intent banner in each file', () => {
    const out = splitSpec(DOC);
    expect(out.specFormal).toContain('Layer = formal');
    expect(out.specFormal).toContain('@kiwa-lab/lean');
    expect(out.specRuntime).toContain('Layer = runtime + human');
    expect(out.specRuntime).toContain('vitest');
  });

  it('T-SK-S-004 reports accurate summary counts', () => {
    const out = splitSpec(DOC);
    expect(out.summary).toEqual({
      total: 3,
      formalCount: 1,
      runtimeCount: 1,
      humanCount: 1,
    });
  });

  it('T-SK-S-005 renders notes when provided', () => {
    const out = splitSpec(DOC);
    expect(out.specFormal).toContain('Uses `@kiwa-lab/lean`');
  });

  it('T-SK-S-006 renders each item with layer + verifyBy metadata', () => {
    const out = splitSpec(DOC);
    expect(out.specFormal).toMatch(/- \*\*Layer\*\* — formal/);
    expect(out.specFormal).toMatch(/- \*\*Verify by\*\* — `Session`/);
    expect(out.specRuntime).toMatch(/- \*\*Layer\*\* — runtime/);
    expect(out.specRuntime).toMatch(
      /- \*\*Verify by\*\* — `tests\/integration\/refresh-rotation\.test\.ts`/,
    );
  });
});
