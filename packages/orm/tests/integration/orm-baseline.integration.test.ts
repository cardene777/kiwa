import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import { setupOrmEnv } from '../../src/index.js';

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
});
const schema = { users };
const MIGRATION = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
`;

/**
 * orm integration domain test — real setupOrmEnv で insert / select / update / delete workflow を assert する。
 */
describe('orm integration — setupOrmEnv workflow', () => {
  it('T-INT-D-001 setupOrmEnv + insert + selectAll', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'a@example.com');
    const rows = env.raw.prepare('SELECT id, email FROM users').all() as Array<{ id: number; email: string }>;
    expect(rows.length).toBe(1);
    expect(rows[0]!.email).toBe('a@example.com');
    await env.stop();
  });

  it('T-INT-D-002 multiple insert で id 順 select', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(2, 'b@example.com');
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'a@example.com');
    const rows = env.raw.prepare('SELECT id, email FROM users ORDER BY id').all() as Array<{ id: number; email: string }>;
    expect(rows.map((r) => r.id)).toEqual([1, 2]);
    await env.stop();
  });

  it('T-INT-D-003 update で email 更新', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(5, 'old@example.com');
    env.raw.prepare('UPDATE users SET email = ? WHERE id = ?').run('new@example.com', 5);
    const row = env.raw.prepare('SELECT email FROM users WHERE id = ?').get(5) as { email: string };
    expect(row.email).toBe('new@example.com');
    await env.stop();
  });

  it('T-INT-D-004 delete で row 除去', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(10, 'del@example.com');
    env.raw.prepare('DELETE FROM users WHERE id = ?').run(10);
    const rows = env.raw.prepare('SELECT id FROM users').all() as Array<{ id: number }>;
    expect(rows.length).toBe(0);
    await env.stop();
  });

  it('T-INT-D-005 unique constraint 違反 throw', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(20, 'dup@example.com');
    expect(() => {
      env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(21, 'dup@example.com');
    }).toThrow(/UNIQUE constraint/);
    await env.stop();
  });
});
