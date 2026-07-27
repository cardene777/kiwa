/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { setupOrmEnv } from '../../src/index.js';

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
});
const schema = { users };
const MIGRATION = `CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);`;

const MODULE = 'orm-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('orm app scenario perf (real workload)', () => {
  it('3-layer perf: bulk insert / query workload / crud cycle', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 15,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 3,
      memoryIterations: 15,
      ops: [
        {
          name: 'bulk_insert (setup + 100 insert)',
          fn: async () => {
            const env = await setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations: MIGRATION });
            const stmt = env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)');
            for (let i = 0; i < 100; i++) stmt.run(i, `u${i}@ex.com`);
            await env.stop();
          },
          serialP95CapMs: 200,
        },
        {
          name: 'query_workload (100 insert + 100 select)',
          fn: async () => {
            const env = await setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations: MIGRATION });
            const ins = env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)');
            for (let i = 0; i < 100; i++) ins.run(i, `u${i}@ex.com`);
            const sel = env.raw.prepare('SELECT * FROM users WHERE id = ?');
            for (let i = 0; i < 100; i++) sel.get(i);
            await env.stop();
          },
          serialP95CapMs: 200,
        },
        {
          name: 'crud_cycle (10 rows × insert+update+delete)',
          fn: async () => {
            const env = await setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations: MIGRATION });
            for (let i = 0; i < 10; i++) {
              env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(i, `u${i}@ex.com`);
              env.raw.prepare('UPDATE users SET email = ? WHERE id = ?').run(`updated${i}@ex.com`, i);
              env.raw.prepare('DELETE FROM users WHERE id = ?').run(i);
            }
            await env.stop();
          },
          serialP95CapMs: 200,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
