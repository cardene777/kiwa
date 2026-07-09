import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import { makeMockAdapter, sampleUserPayload } from '../../src/adapters/mock.js';
import {
  driveCompatibilityModesFlow,
  driveEvolutionFlow,
  drivePublishFlow,
  driveRegisterFlow,
} from '../../src/flows/redpanda-flows.js';

const MODULE = 'dogfood-redpanda-schema-registry';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveRegister / driveEvolution / driveCompatibilityModes / drivePublish',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveRegister',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveRegisterFlow(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'driveEvolution',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveEvolutionFlow(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'driveCompatibilityModes',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveCompatibilityModesFlow(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'drivePublish',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await drivePublishFlow(adapter, [sampleUserPayload({ id: 'p1' })]);
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
