import { describe, expect, it } from 'vitest';
import { parseSpec } from '../src/index.js';

describe('parseSpec', () => {
  it('parses meta + table rows', () => {
    const md = `# test-spec

- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | 正常系 | DB空 | POST /items | 201 + id返却 | P0 | yes | mock | /api/items |
| T-API-002 | 異常系 | bodyなし | POST /items | 400 | P1 | yes | mock | /api/items |
`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('items');
    expect(doc.layer).toBe('api');
    expect(doc.cases).toHaveLength(2);
    expect(doc.cases[0]?.id).toBe('T-API-001');
    expect(doc.cases[0]?.priority).toBe('P0');
    expect(doc.cases[0]?.automation).toBe('yes');
    expect(doc.cases[0]?.mode).toBe('mock');
    expect(doc.cases[0]?.route).toBe('/api/items');
    expect(doc.warnings).toEqual([]);
  });

  it('falls back to default layer when meta is missing', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md, { module: 'fallback', defaultLayer: 'unit' });
    expect(doc.module).toBe('fallback');
    expect(doc.layer).toBe('unit');
    expect(doc.cases).toHaveLength(1);
  });

  it('emits warning when required columns are missing', () => {
    const md = `| ID | Observation |
|---|---|
| T-001 | only obs |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(0);
    expect(doc.warnings.some((w) => w.includes('required columns missing'))).toBe(true);
  });

  it('emits warning for unknown mode but still records the case', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes | weird |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.mode).toBeUndefined();
    expect(doc.warnings.some((w) => w.includes('unknown mode'))).toBe(true);
  });

  it('emits warning when no table is found', () => {
    const doc = parseSpec('- module: x\n- layer: api\n');
    expect(doc.cases).toHaveLength(0);
    expect(doc.warnings).toContain('no test case table found');
  });
});
