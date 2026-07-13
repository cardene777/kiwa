import { describe, expect, it } from 'vitest';
import { parseSpec } from '../src/parser.js';

describe('parseSpec defensive branches', () => {
  it('handles markdown with no test case table (warning)', () => {
    const result = parseSpec(`
# Module: X
- module: X
- layer: unit

Some prose but no table.
`);
    expect(result.warnings.some((w) => w.includes('no test case table'))).toBe(
      true,
    );
    expect(result.cases).toEqual([]);
  });

  it('handles empty markdown (no meta, no table)', () => {
    const result = parseSpec('');
    expect(result.cases).toEqual([]);
  });

  it('parses meta lines with full-width colon', () => {
    const result = parseSpec(`
- module: my-module
- layer: unit
`);
    expect(result.module).toBe('my-module');
    expect(result.layer).toBe('unit');
  });

  it('parses valid spec table with all columns', () => {
    const result = parseSpec(`# test-spec
- module: my-module
- layer: unit

| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-001 | 正常系 | setup | act | expected | P0 | yes | mock |
`);
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]?.id).toBe('T-001');
  });

  it('handles table with unknown mode value (warning)', () => {
    const result = parseSpec(`
- module: X
- layer: unit

| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-1 | obs | s | a | e | P0 | yes | bogus-mode |
`);
    expect(result.warnings.some((w) => w.includes('unknown mode'))).toBe(true);
  });

  it('handles table with only header + divider (no data rows)', () => {
    const result = parseSpec(`
- module: X
- layer: unit

| ID | Observation |
|----|-------|
`);
    expect(result.cases).toEqual([]);
  });

  it('handles table interrupted by blank row', () => {
    const result = parseSpec(`
- module: X
- layer: unit

| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-1 | obs | s | a | e | P0 | yes |

More text after blank.
`);
    expect(result.cases.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to default when meta is missing', () => {
    const result = parseSpec(
      `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-1 | obs | s | a | e | P0 | yes |
`,
      { module: 'default-mod', defaultLayer: 'unit' },
    );
    expect(result.module).toBe('default-mod');
    expect(result.layer).toBe('unit');
  });
});
