import { expect, it } from 'vitest';
import { expectQuery, expectRowCount, setupOrmEnv } from '../src/index.js';

it('runs the documented SQLite migration and query recipes', async () => {
  const env = await setupOrmEnv({
    mode: 'mock',
    orm: 'drizzle',
    dialect: 'sqlite',
    schema: {},
    migrations: [
      'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE)',
      "INSERT INTO users (id, name, email) VALUES (1, 'kiwa', 'ada@example.test')",
    ],
  });

  try {
    await expectQuery(env, 'SELECT id, name FROM users', [{ id: 1, name: 'kiwa' }], expect);
    await expectRowCount(env, 'users', 1, expect);
    expect(() => {
      env.raw.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)').run(2, 'duplicate', 'ada@example.test');
    }).toThrow(/UNIQUE constraint/);
  } finally {
    await env.stop();
  }
});
