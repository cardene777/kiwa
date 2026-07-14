import { describe, expect, it } from 'vitest';
import { checkSpecConformance, assertDesignConformance } from '../src/index.js';

describe('checkSpecConformance', () => {
  it('T-DCC-001 全一致で pass', () => {
    const spec = { colors: { primary: '#3b82f6' }, spacing: { md: 16 } };
    const actual = { colors: { primary: '#3b82f6' }, spacing: { md: 16 } };
    const result = checkSpecConformance(spec, actual);
    expect(result.pass).toBe(true);
    expect(result.divergences.length).toBe(0);
    expect(result.checkedCount).toBe(2);
  });

  it('T-DCC-002 color mismatch 検知', () => {
    const spec = { colors: { primary: '#3b82f6' } };
    const actual = { colors: { primary: '#ff0000' } };
    const result = checkSpecConformance(spec, actual);
    expect(result.pass).toBe(false);
    expect(result.divergences[0]!.category).toBe('mismatch');
    expect(result.divergences[0]!.path).toBe('colors.primary');
  });

  it('T-DCC-003 missing color 検知', () => {
    const spec = { colors: { primary: '#3b82f6', secondary: '#000' } };
    const actual = { colors: { primary: '#3b82f6' } };
    const result = checkSpecConformance(spec, actual);
    expect(result.pass).toBe(false);
    expect(result.divergences.length).toBe(1);
    expect(result.divergences[0]!.category).toBe('missing');
    expect(result.divergences[0]!.path).toBe('colors.secondary');
  });

  it('T-DCC-004 spacing mismatch 検知', () => {
    const spec = { spacing: { md: 16 } };
    const actual = { spacing: { md: 20 } };
    const result = checkSpecConformance(spec, actual);
    expect(result.pass).toBe(false);
    expect(result.divergences[0]!.expected).toBe(16);
    expect(result.divergences[0]!.actual).toBe(20);
  });

  it('T-DCC-005 typography 差分検知', () => {
    const spec = { typography: { body: { fontSize: 14, fontWeight: 400 } } };
    const actual = { typography: { body: { fontSize: 14, fontWeight: 700 } } };
    const result = checkSpecConformance(spec, actual);
    expect(result.pass).toBe(false);
    expect(result.divergences[0]!.path).toBe('typography.body.fontWeight');
  });

  it('T-DCC-006 components 差分検知', () => {
    const spec = { components: { Button: { padding: 8, borderRadius: 4 } } };
    const actual = { components: { Button: { padding: 8, borderRadius: 8 } } };
    const result = checkSpecConformance(spec, actual);
    expect(result.pass).toBe(false);
    expect(result.divergences[0]!.path).toBe('components.Button.borderRadius');
  });

  it('T-DCC-007 empty spec = pass', () => {
    const result = checkSpecConformance({}, {});
    expect(result.pass).toBe(true);
    expect(result.checkedCount).toBe(0);
  });

  it('T-DCC-008 assertDesignConformance pass で throw なし', () => {
    expect(() => assertDesignConformance({ colors: { p: '#000' } }, { colors: { p: '#000' } })).not.toThrow();
  });

  it('T-DCC-009 assertDesignConformance fail で throw', () => {
    expect(() =>
      assertDesignConformance({ colors: { p: '#000' } }, { colors: { p: '#fff' } }),
    ).toThrow(/design spec conformance failed/);
  });

  it('T-DCC-010 checkedCount で category count 集計', () => {
    const spec = {
      colors: { p: '#000', s: '#fff' },
      spacing: { md: 16 },
      typography: { body: { fontSize: 14 } },
      components: { Button: {} },
    };
    const actual = spec;
    const result = checkSpecConformance(spec, actual);
    expect(result.checkedCount).toBe(5);
    expect(result.pass).toBe(true);
  });
});
