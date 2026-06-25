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

  it('T-PARSE-006 priority fallback P2 - unknown priority "foo" → P2', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | foo | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P2');
  });

  it('T-PARSE-007 priority empty - missing column → P2 fallback', () => {
    const md = `| ID | Observation | Given | When | Then | Automation |
|---|---|---|---|---|---|
| T-001 | a | b | c | d | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P2');
  });

  it('T-PARSE-008 priority P0/P1/P2/P3 - 全 valid 値 record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-P0 | a | b | c | d | P0 | yes |
| T-P1 | a | b | c | d | P1 | yes |
| T-P2 | a | b | c | d | P2 | yes |
| T-P3 | a | b | c | d | P3 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.priority)).toEqual(['P0', 'P1', 'P2', 'P3']);
  });

  it('T-PARSE-009 priority lowercase p0 - uppercase 化で P0 record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | p0 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P0');
  });

  it('T-PARSE-010 automation values - yes / manual / no fallback', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-Y | a | b | c | d | P2 | yes |
| T-M | a | b | c | d | P2 | manual |
| T-N | a | b | c | d | P2 | tbd |
| T-E | a | b | c | d | P2 | |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.automation)).toEqual(['yes', 'manual', 'no', 'no']);
  });

  it('T-PARSE-011 id skip - id 空 / id "-" 始まりは row drop', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
|  | empty-id | b | c | d | P2 | yes |
| -divider | divider | b | c | d | P2 | yes |
| T-001 | valid | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-001');
  });

  it('T-PARSE-012 mode valid - mock / live / hybrid 全 record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-MO | a | b | c | d | P2 | yes | mock |
| T-LI | a | b | c | d | P2 | yes | live |
| T-HY | a | b | c | d | P2 | yes | hybrid |
`;
    const doc = parseSpec(md);
    expect(doc.cases.map((c) => c.mode)).toEqual(['mock', 'live', 'hybrid']);
    expect(doc.warnings).toEqual([]);
  });

  it('T-PARSE-013 mode empty - mode column 空欄は warning なし', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes |  |
`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.mode).toBeUndefined();
    expect(doc.warnings.filter((w) => w.includes('unknown mode'))).toEqual([]);
  });

  it('T-PARSE-014 unknown layer - meta "layer: xxx" は warning 出して default layer 採用', () => {
    const md = `- module: items
- layer: zzz

| ID | Observation | Given | When | Then | Priority | Automation |
|---|---|---|---|---|---|---|
| T-001 | a | b | c | d | P2 | yes |
`;
    const doc = parseSpec(md, { defaultLayer: 'unit' });
    expect(doc.layer).toBe('unit');
    expect(doc.warnings.some((w) => w.includes('unknown layer'))).toBe(true);
  });

  it('T-PARSE-015 valid layers - contract / unit / integration / e2e / api / ui / data / cli', () => {
    const layers = ['contract', 'unit', 'integration', 'e2e', 'api', 'ui', 'data', 'cli'];
    for (const layer of layers) {
      const md = `- layer: ${layer}\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
      const doc = parseSpec(md);
      expect(doc.layer).toBe(layer);
    }
  });

  it('T-PARSE-016 case-insensitive layer - "API" → "api"', () => {
    const md = `- layer: API\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.layer).toBe('api');
  });

  it('T-PARSE-017 module from opts overrides meta line', () => {
    const md = `- module: from-meta\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md, { module: 'from-opts' });
    expect(doc.module).toBe('from-opts');
  });

  it('T-PARSE-018 module from meta when opts.module empty', () => {
    const md = `- module: from-meta\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('from-meta');
  });

  it('T-PARSE-019 module default empty string', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('');
  });

  it('T-PARSE-020 raw field - returned as-is from markdown input', () => {
    const md = `| ID |\n|---|\n`;
    const doc = parseSpec(md);
    expect(doc.raw).toBe(md);
  });

  it('T-PARSE-021 meta line - "*" prefix も "-" prefix も同等 parse', () => {
    const md = `* module: starred\n* layer: ui\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('starred');
    expect(doc.layer).toBe('ui');
  });

  it('T-PARSE-022 meta line - 全角コロン (":") も半角と同等 parse', () => {
    const md = `- module: jp-colon\n- layer: data\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('jp-colon');
    expect(doc.layer).toBe('data');
  });

  it('T-PARSE-023 table header divider - colon-cell ":---:" でも認識', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
  });

  it('T-PARSE-024 empty rows after table - stop processing', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n\n| ID | Observation |\n|---|---|\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
  });

  it('T-PARSE-025 notes column - HEADER_KEYS にない notes は無視 (route のみ記録)', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Route | Notes |\n|---|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes | /x | memo |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.route).toBe('/x');
    expect(doc.cases[0]?.notes).toBeUndefined();
  });

  it('T-PARSE-026 route empty - route 列空欄なら .route undefined', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation | Route |\n|---|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |  |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.route).toBeUndefined();
  });

  it('T-PARSE-027 layer recognition - both upper and lowercase + meta order independence', () => {
    const md1 = `- layer: UI\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const md2 = `- module: x\n- layer: cli\n\n| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    expect(parseSpec(md1).layer).toBe('ui');
    expect(parseSpec(md2).layer).toBe('cli');
  });

  it('T-PARSE-028 row with extra leading/trailing | 文字 - splitRow が trim する', () => {
    const md = `|ID|Observation|Given|When|Then|Priority|Automation|\n|---|---|---|---|---|---|---|\n|T-001|a|b|c|d|P2|yes|\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(1);
    expect(doc.cases[0]?.id).toBe('T-001');
  });

  it('T-PARSE-029 layer default - opts/meta なしなら "unit"', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.layer).toBe('unit');
  });

  it('T-PARSE-030 header missing - findTable returned but headerRow missing (edge case)', () => {
    const md = `\n|---|\n`;
    const doc = parseSpec(md);
    expect(doc.cases).toHaveLength(0);
  });

  it('T-PARSE-031 CRLF line ending - \\r\\n でも parse', () => {
    const md = `- module: crlf\r\n- layer: api\r\n\r\n| ID | Observation | Given | When | Then | Priority | Automation |\r\n|---|---|---|---|---|---|---|\r\n| T-001 | a | b | c | d | P2 | yes |\r\n`;
    const doc = parseSpec(md);
    expect(doc.module).toBe('crlf');
    expect(doc.cases).toHaveLength(1);
  });

  it('T-PARSE-032 priority specific - P3 record (boundary between known/unknown)', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P3 | yes |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.priority).toBe('P3');
  });

  it('T-PARSE-033 automation manual - explicit "manual" record', () => {
    const md = `| ID | Observation | Given | When | Then | Priority | Automation |\n|---|---|---|---|---|---|---|\n| T-001 | a | b | c | d | P2 | manual |\n`;
    const doc = parseSpec(md);
    expect(doc.cases[0]?.automation).toBe('manual');
  });
});
