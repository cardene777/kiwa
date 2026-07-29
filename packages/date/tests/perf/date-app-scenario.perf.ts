/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createDateClient,
  addDays,
  diffDays,
  formatDate,
  parseDate,
  timezoneConvert,
} from '../../src/index.js';

const MODULE = 'date-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('date app scenario perf (real workload)', () => {
  it('3-layer perf: multi_provider_workflow / format_parse_batch / parse_error_handling', async () => {
    const base = new Date(Date.UTC(2026, 0, 1));
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'multi_provider_workflow (10 arithmetic across 4 providers)',
          fn: async () => {
            const providers = ['date-fns', 'dayjs', 'luxon', 'temporal'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createDateClient({ provider: providers[i % 4] });
              const next = client.addDays(base, i);
              client.diffDays(next, base);
              client.toTimezone(next, 'Asia/Tokyo');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'format_parse_batch (5 format + parse round-trip)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const shifted = addDays(base, i, 'date-fns').result;
              const formatted = formatDate(shifted, 'YYYY-MM-DD HH:mm:ss', 'date-fns').formatted;
              const parsed = parseDate(formatted, 'YYYY-MM-DD HH:mm:ss', 'date-fns').date;
              diffDays(parsed, shifted, 'date-fns');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'parse_error_handling (5 invalid string throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                parseDate('not-a-date', 'YYYY-MM-DD', 'dayjs');
              } catch { /* handled */ }
            }
            // tz convert with unknown tz falls back gracefully (no throw)
            for (let i = 0; i < 3; i++) {
              timezoneConvert(base, 'Unknown/Zone', 'luxon');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
