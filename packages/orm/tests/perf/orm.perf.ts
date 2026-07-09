import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { eq } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { setupOrmEnv } from '../../src/index.js';
import type { OrmTestEnvMock } from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'orm';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
});
const schema = { users };
type AppSchema = typeof schema;

const MIGRATION = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
`;

describe(MODULE, () => {
  it(
    '3-layer perf: setupOrmEnv + drizzle insert / select / where roundtrip',
    async () => {
      // Reuse a single env across iterations. Iteration N inserts row (N + base)
      // then reads it back — deterministic + bounded (200 iterations * 1 row).
      // Fresh env per iteration would drift baseline toward migration cost,
      // which is not the primary path we care about (setupOrmEnv migration is
      // one-time at test bootstrap).
      const env: OrmTestEnvMock<AppSchema> = await setupOrmEnv({
        mode: 'mock',
        orm: 'drizzle',
        dialect: 'sqlite',
        schema,
        migrations: MIGRATION,
      });
      let insertCounter = 0;

      try {
        const result = await runPerf3Layer({
          moduleName: MODULE,
          reportPath: REPORT_PATH,
          baselinePath: BASELINE_PATH,
          ops: [
            {
              // Drizzle INSERT via sqlite in-memory. Primary write path.
              // Real prod path uses better-sqlite3 native binding — mock uses
              // the same driver (better-sqlite3 in-memory), so latency is
              // representative of the ORM layer overhead only.
              name: 'drizzleInsert',
              serialP95CapMs: 10,
              fn: () => {
                insertCounter += 1;
                env.db
                  .insert(users)
                  .values({ id: insertCounter, email: `u${insertCounter}@x` })
                  .run();
              },
            },
            {
              // Drizzle SELECT all — read path with unbounded table row count
              // (growing with insert counter). Cap sits above JS floor to
              // absorb SQL parse + result marshaling.
              name: 'drizzleSelectAll',
              serialP95CapMs: 20,
              fn: () => {
                const rows = env.db.select().from(users).all();
                if (!Array.isArray(rows)) throw new Error('select failed');
              },
            },
            {
              // Drizzle SELECT with where + eq — indexed lookup path.
              name: 'drizzleSelectWhere',
              serialP95CapMs: 10,
              fn: () => {
                env.db.select().from(users).where(eq(users.id, 1)).all();
              },
            },
          ],
        });

        for (const outcome of result.outcomes) {
          expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
          expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
          expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
        }
        expect(result.allPassed).toBe(true);
      } finally {
        await env.stop();
      }
    },
    120_000,
  );
});
