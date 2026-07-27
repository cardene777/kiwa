import {
  analyzeSpecCoverage,
  collectRunHistory,
  correlateLogsAndSpans,
  createOtelMock,
  detectFlaky,
  logs_forHttpTrace,
  renderDashboard,
  trace_httpHandler,
} from '@kiwa-lab/observability';
import { describe, expect, it } from 'vitest';

describe('library documentation observability recipes', () => {
  it('classifies mixed pass and failure history as flaky', () => {
    const history = collectRunHistory({
      records: [
        {
          testId: 'T-API-001',
          fullName: 'T-API-001 returns a user',
          status: 'passed',
          durationMs: 12,
          runId: 'ci-1',
          startedAt: 1,
        },
        {
          testId: 'T-API-001',
          fullName: 'T-API-001 returns a user',
          status: 'failed',
          durationMs: 8,
          runId: 'ci-2',
          startedAt: 2,
        },
      ],
      maxPerTest: 20,
    });

    expect(detectFlaky({ history, minRuns: 2, threshold: 0.1 })).toMatchObject([
      { testId: 'T-API-001', failureRate: 0.5 },
    ]);
  });

  it('renders a missing specification case in the dashboard', () => {
    const gap = analyzeSpecCoverage({
      specMarkdown:
        '# test-spec-users (api layer)\n\n- module: users\n- layer: api\n\n| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |\n|---|---|---|---|---|---|---|---|---|\n| T-API-001 | user | a | b | c | P0 | yes | mock | /users |\n| T-API-002 | invalid | a | b | c | P0 | yes | mock | /users |',
      testCode: "it('T-API-001 returns a user', () => {})",
      module: 'users',
      defaultLayer: 'api',
    });
    const dashboard = renderDashboard({
      history: collectRunHistory({ records: [] }),
      flaky: [],
      gaps: [gap],
    });

    expect(gap.missingTcIds).toEqual(['T-API-002']);
    expect(dashboard).toContain('T-API-002');
  });

  it('collects application spans metrics and logs without an external backend', () => {
    const otel = createOtelMock();
    const span = otel.tracer.startSpan('handle-request', {
      attributes: { route: '/api/users' },
    });
    otel.meter.createCounter('requests.total').add(1, { route: '/api/users' });
    otel.logger.emit({
      level: 'info',
      message: 'request complete',
      attributes: { status: 200 },
    });
    span.end();

    expect(otel.collector.spanByName('handle-request')?.attributes.route).toBe('/api/users');
    expect(otel.collector.metricSum('requests.total')).toBe(1);
    expect(otel.collector.logs[0]).toMatchObject({
      level: 'info',
      message: 'request complete',
    });
  });

  it('joins logs and spans that have the same trace ID', () => {
    const index = correlateLogsAndSpans({
      logs: logs_forHttpTrace(),
      spans: trace_httpHandler(),
    });

    expect(index.logsForTrace('trace-http-handler')).toHaveLength(4);
    expect(index.spansForTrace('trace-http-handler')).toHaveLength(3);
  });
});
