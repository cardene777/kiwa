import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
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
 * orm skill domain test — orm lib の主要 skill flow を spy 経路で assert する。
 */
describe('orm skill — setupOrmEnv skill flow', () => {
  it('T-SKL-D-001 setup + insert + select skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    spy.record('orm.setupOrmEnv', '{}');
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'sk1@example.com');
    spy.record('orm.insert', JSON.stringify({ id: 1 }));
    const rows = env.raw.prepare('SELECT * FROM users').all();
    spy.record('orm.select', '{}');

    assertToolCallOrder(spy, ['orm.setupOrmEnv', 'orm.insert', 'orm.select']);
    expect(rows.length).toBe(1);
    await env.stop();
  });

  it('T-SKL-D-002 update skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(2, 'old@example.com');
    spy.record('orm.insert', '{}');
    env.raw.prepare('UPDATE users SET email = ? WHERE id = ?').run('new@example.com', 2);
    spy.record('orm.update', '{}');

    assertToolCallOrder(spy, ['orm.insert', 'orm.update']);
    await env.stop();
  });

  it('T-SKL-D-003 batch insert skill (times=3)', async () => {
    const spy = createToolSpy();
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    for (const i of [3, 4, 5]) {
      env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(i, `u${i}@example.com`);
      spy.record('orm.insert', '{}');
    }

    assertToolCalled(spy, 'orm.insert', { times: 3 });
    await env.stop();
  });

  it('T-SKL-D-004 delete skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(10, 'del@example.com');
    spy.record('orm.insert', '{}');
    env.raw.prepare('DELETE FROM users WHERE id = ?').run(10);
    spy.record('orm.delete', '{}');
    const rows = env.raw.prepare('SELECT * FROM users').all();
    spy.record('orm.select', '{}');

    assertToolCallOrder(spy, ['orm.insert', 'orm.delete', 'orm.select']);
    expect(rows.length).toBe(0);
    await env.stop();
  });

  it('T-SKL-D-005 batch skill (batch insert + select)', async () => {
    const spy = createToolSpy();
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    const stmt = env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)');
    for (const i of [20, 21, 22]) {
      stmt.run(i, `batch${i}@example.com`);
    }
    spy.record('orm.batchInsert', JSON.stringify({ count: 3 }));
    const rows = env.raw.prepare('SELECT id FROM users ORDER BY id').all() as Array<{ id: number }>;
    spy.record('orm.select', '{}');

    assertToolCallOrder(spy, ['orm.batchInsert', 'orm.select']);
    expect(rows.map((r) => r.id)).toEqual([20, 21, 22]);
    await env.stop();
  });
});
