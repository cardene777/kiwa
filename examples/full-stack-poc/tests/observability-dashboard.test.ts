// Layer: observability (collect + flaky + dashboard)
import { describe, expect, it } from 'vitest';
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
} from '@kiwa/observability';

describe('full-stack observability', () => {
  it('renders a dashboard combining run history + flaky + coverage gaps', () => {
    const report = {
      startTime: 100,
      testResults: [
        {
          testFilePath: 'a.test.ts',
          assertionResults: [
            { fullName: 'todo > T-UNIT-001 normalize', status: 'passed' as const, duration: 1 },
            { fullName: 'todo > T-UNIT-002 validate', status: 'passed' as const, duration: 1 },
            { fullName: 'todo > T-API-001 GET', status: 'passed' as const, duration: 5 },
            { fullName: 'todo > T-API-002 POST', status: 'failed' as const, duration: 8 },
          ],
        },
      ],
    };
    const recordsRun1 = fromVitestJson(report, { runId: 'r-1' });
    const recordsRun2 = fromVitestJson(
      { ...report, testResults: report.testResults.map((file) => ({ ...file, assertionResults: file.assertionResults.map((a) => ({ ...a, status: 'passed' as const })) })) },
      { runId: 'r-2' },
    );
    const history = collectRunHistory({ records: [...recordsRun1, ...recordsRun2] });
    const flaky = detectFlaky({ history, minRuns: 2, threshold: 0.1 });

    const specMarkdown = `- module: todo\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-API-001 | GET | a | b | c | P0 | yes | live | /api/todos |\n| T-API-002 | POST | a | b | c | P0 | yes | live | /api/todos |\n| T-API-003 | toggle | a | b | c | P1 | yes | live | /api/todos |\n`;
    const testCode = `it('T-API-001', () => {}); it('T-API-002', () => {});`;
    const gaps = [analyzeSpecCoverage({ specMarkdown, testCode })];

    const dashboard = renderDashboard({ history, flaky, gaps });
    expect(dashboard).toContain('# kiwa observability dashboard');
    expect(dashboard).toContain('| total records | 8 |');
    expect(dashboard).toContain('T-API-002');
    expect(dashboard).toContain('### todo (api)');
    expect(dashboard).toContain('- T-API-003');
  });
});
