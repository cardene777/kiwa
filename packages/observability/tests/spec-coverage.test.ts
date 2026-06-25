import { describe, expect, it } from 'vitest';
import { analyzeSpecCoverage } from '../src/index.js';

const spec = `# test-spec-items (api layer)

- module: items
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | a | b | c | d | P0 | yes | live | /api/items |
| T-API-002 | a | b | c | d | P0 | yes | live | /api/items |
| T-API-003 | a | b | c | d | P0 | yes | live | /api/items |
`;

describe('analyzeSpecCoverage', () => {
  it('reports missing TC IDs when test file is empty', () => {
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: '' });
    expect(gap.module).toBe('items');
    expect(gap.layer).toBe('api');
    expect(gap.missingTcIds).toEqual(['T-API-001', 'T-API-002', 'T-API-003']);
    expect(gap.extraTcIds).toEqual([]);
  });

  it('reports no gap when every TC is referenced', () => {
    const test = `it('T-API-001 first', () => {});
it('T-API-002 second', () => {});
it('T-API-003 third', () => {});`;
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: test });
    expect(gap.missingTcIds).toEqual([]);
    expect(gap.extraTcIds).toEqual([]);
  });

  it('reports extra TC IDs not present in spec', () => {
    const test = `it('T-API-001', () => {}); it('T-API-999 stray', () => {});`;
    const gap = analyzeSpecCoverage({ specMarkdown: spec, testCode: test });
    expect(gap.missingTcIds).toEqual(['T-API-002', 'T-API-003']);
    expect(gap.extraTcIds).toEqual(['T-API-999']);
  });
});
