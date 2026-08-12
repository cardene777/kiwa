// End-to-end smoke for the observability pipeline:
//   - take a realistic vitest JSON report (verbatim shape, captured from a `vitest run --reporter=json` invocation)
//   - feed it through fromVitestJson + detectFlaky + analyzeSpecCoverage + renderDashboard
//   - assert the dashboard exposes every canonical section, lists missing TC IDs, and surfaces flaky tests.
// Spawning a nested vitest from inside vitest is fragile across pnpm/vitest internals, so we
// inline the fixture here instead. Users wire the real CI flow via `pnpm exec vitest run --reporter=json --outputFile`.
import { describe, expect, it } from 'vitest';
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
  type VitestStyleReport,
} from '@kiwa-lab/observability';

const RUN_1: VitestStyleReport = {
  startTime: 1700000000,
  testResults: [
    {
      testFilePath: 'tests/api-todo.test.ts',
      assertionResults: [
        { fullName: 'todo > T-API-001 GET happy', status: 'passed', duration: 12 },
        { fullName: 'todo > T-API-002 POST happy', status: 'failed', duration: 18 },
        { fullName: 'todo > T-API-003 toggle', status: 'passed', duration: 9 },
      ],
    },
    {
      testFilePath: 'tests/unit-todo.test.ts',
      assertionResults: [
        { fullName: 'todo > T-UNIT-001 normalize', status: 'passed', duration: 1 },
        { fullName: 'todo > T-UNIT-002 validate', status: 'passed', duration: 1 },
      ],
    },
  ],
};

const RUN_2: VitestStyleReport = {
  startTime: 1700001000,
  testResults: [
    {
      testFilePath: 'tests/api-todo.test.ts',
      assertionResults: [
        { fullName: 'todo > T-API-001 GET happy', status: 'passed', duration: 12 },
        { fullName: 'todo > T-API-002 POST happy', status: 'passed', duration: 18 },
        { fullName: 'todo > T-API-003 toggle', status: 'passed', duration: 9 },
      ],
    },
  ],
};

const SPEC_MARKDOWN = `- module: todo
- layer: api

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-API-001 | GET | a | b | c | P0 | yes | live | /api/todos |
| T-API-002 | POST | a | b | c | P0 | yes | live | /api/todos |
| T-API-003 | toggle | a | b | c | P0 | yes | live | /api/todos |
| T-API-004 | delete (planned) | a | b | c | P1 | yes | live | /api/todos |
`;

const TEST_CODE = `it('T-API-001 GET happy', () => {});
it('T-API-002 POST happy', () => {});
it('T-API-003 toggle', () => {});
`;

describe('observability pipeline round-trip', () => {
  it('renders a dashboard that exposes summary, flaky tests, and coverage gaps', () => {
    const records = [
      ...fromVitestJson(RUN_1, { runId: 'run-1' }),
      ...fromVitestJson(RUN_2, { runId: 'run-2' }),
    ];
    expect(records.length).toBe(8);
    const history = collectRunHistory({ records });
    const flaky = detectFlaky({ history, minRuns: 2, threshold: 0.1 });
    expect(flaky.some((t) => t.testId === 'T-API-002')).toBe(true);

    const gaps = [analyzeSpecCoverage({ specMarkdown: SPEC_MARKDOWN, testCode: TEST_CODE })];
    expect(gaps[0]?.missingTcIds).toEqual(['T-API-004']);

    // 検出に使った minRuns を表示にも渡す。 渡さないと表示側は既定 (3) で
    // 判定の有無を導き直し、 文言が実際の判定とずれる (#1909)。
    const dashboard = renderDashboard({ history, flaky, gaps, flakyMinRuns: 2 });
    expect(dashboard).toContain('# kiwa observability dashboard');
    expect(dashboard).toContain('## Summary');
    expect(dashboard).toContain('## Flaky tests');
    expect(dashboard).toContain('| T-API-002 |');
    expect(dashboard).toContain('## Spec coverage gaps');
    expect(dashboard).toContain('### todo (api)');
    expect(dashboard).toContain('- T-API-004');
    expect(dashboard).toContain('| total records | 8 |');
  });
});
