/**
 * mock 経路が `migrations` の 2 つの形を取り違えないことの検査 (Issue #2170)。
 *
 * `migrations` は「SQL の文字列」 と「drizzle-kit / kysely が生成した folder」 の
 * 2 形を受ける。 実装はこの 2 形で **別の経路** を通り、 片方だけが coverage 上
 * 実行回数 0 だった。
 *
 * | 経路 | 0 だった側 |
 * |---|---|
 * | drizzle + mock + sqlite | folder (`drizzle-orm/better-sqlite3/migrator`) |
 * | kysely + mock + sqlite | inline SQL (`splitSqlStatements` + `raw.exec`) |
 *
 * ## 差し替えを使わない
 *
 * どちらも in-memory SQLite で完結する。 migrator も driver も実物を通すので、
 * 「どちらの経路を通ったか」 を DB に残る痕跡で判定できる。
 *
 * 痕跡は migration の台帳表。 folder 経路だけが台帳 (`__drizzle_migrations` /
 * `kysely_migration`) を作るため、 表の有無で経路が確定する。 適用結果 (users 表が
 * ある) だけを見ると、 2 経路を取り違えても同じに見えてしまう。
 */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { afterEach, describe, expect, it } from 'vitest';
import { setupOrmEnv } from '../src/index.js';

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
});
const drizzleSchema = { users };

interface KyselyDb {
  users: { id: number; email: string };
}

let tmp: string | null = null;
let stopEnv: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (stopEnv !== null) {
    await stopEnv();
    stopEnv = null;
  }
  if (tmp !== null) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

/**
 * drizzle-kit が出力する形の folder を書く。
 *
 * migrator は `meta/_journal.json` の `entries` を読み、 各 entry の `tag` から
 * `<tag>.sql` を探す。 1 file 内は `--> statement-breakpoint` で区切る (`;` ではない)。
 * 区切りを違えると 2 文目が黙って捨てられるため、 2 文入れて両方の適用を見る。
 */
async function writeDrizzleMigrationFolder(): Promise<string> {
  tmp = await mkdtemp(join(tmpdir(), 'kiwa-drizzle-migrator-'));
  await mkdir(join(tmp, 'meta'), { recursive: true });
  await writeFile(
    join(tmp, 'meta', '_journal.json'),
    JSON.stringify({
      version: '7',
      dialect: 'sqlite',
      entries: [{ idx: 0, version: '6', when: 1_735_689_600_000, tag: '0000_create_users', breakpoints: true }],
    }),
  );
  await writeFile(
    join(tmp, '0000_create_users.sql'),
    [
      'CREATE TABLE `users` (\n\t`id` integer PRIMARY KEY NOT NULL,\n\t`email` text NOT NULL\n);',
      '--> statement-breakpoint',
      'CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);',
    ].join('\n'),
  );
  return tmp;
}

/** better-sqlite3 の raw client。 `env.raw` は union なのでここで絞る。 */
interface SqliteRaw {
  prepare: (sql: string) => { all: (...params: unknown[]) => unknown[] };
}

/** SQLite が持っている object 名を種類ごとに数える。 */
function namesOf(raw: SqliteRaw, type: 'table' | 'index'): string[] {
  const rows = raw.prepare("select name from sqlite_master where type = ?").all(type) as { name: string }[];
  return rows.map((r) => r.name);
}

describe('setupOrmEnv — drizzle + mock + sqlite の folder migration (#2170)', () => {
  it('T-MMS-001 folder を渡すと drizzle の migrator が台帳を作って適用する', async () => {
    const folder = await writeDrizzleMigrationFolder();
    const env = await setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema: drizzleSchema, migrations: { folder } });
    stopEnv = env.stop;
    const raw = env.raw as unknown as SqliteRaw;

    // 台帳表は folder 経路だけが作る。 inline SQL 経路に倒れていたら残らない。
    expect(namesOf(raw, 'table'), 'migrator の台帳が残る').toContain('__drizzle_migrations');
    expect(namesOf(raw, 'table'), 'migration の中身も適用される').toContain('users');
    // `--> statement-breakpoint` の後ろまで届いていることを、 index の有無で見る。
    expect(namesOf(raw, 'index'), '2 文目も適用される').toContain('users_email_unique');

    const applied = raw.prepare('select hash, created_at from __drizzle_migrations').all() as {
      hash: string;
      created_at: number;
    }[];
    expect(applied, '適用済として 1 件記録する').toHaveLength(1);
    // journal の `when` をそのまま台帳へ書く。 ここがずれると次回に再適用される。
    expect(Number(applied[0]?.created_at)).toBe(1_735_689_600_000);
    expect(String(applied[0]?.hash).length, 'migration file の hash を残す').toBeGreaterThan(0);
  });

  it('T-MMS-002 folder migration の後に seed が組み立て済の db を受け取る', async () => {
    const folder = await writeDrizzleMigrationFolder();
    const seen: unknown[] = [];
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema: drizzleSchema,
      migrations: { folder },
      seed: async (db) => {
        // migration が先に走っていないと、この insert は表が無くて落ちる。
        await db.insert(users).values({ id: 1, email: 'a@example.com' });
        seen.push(db);
      },
    });
    stopEnv = env.stop;

    expect(seen, 'seed は 1 度だけ').toHaveLength(1);
    expect(seen[0], 'seed が受け取るのは db').toBe(env.db);
    const rows = await env.db.select().from(users);
    expect(rows, 'seed の書込みが残る').toHaveLength(1);
    expect(rows[0]?.email).toBe('a@example.com');
  });

  it('T-MMS-003 journal が無い folder はその旨を名指しして止まる', async () => {
    // 空の dir を渡す。 migrator は `meta/_journal.json` を最初に探す。
    tmp = await mkdtemp(join(tmpdir(), 'kiwa-drizzle-empty-'));
    await expect(
      setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema: drizzleSchema, migrations: { folder: tmp } }),
    ).rejects.toThrow(/_journal\.json/);
  });
});

describe('setupOrmEnv — kysely + mock + sqlite の inline SQL migration (#2170)', () => {
  it('T-MMS-101 1 本の文字列を `;` で分けて 1 文ずつ適用する', async () => {
    const env = await setupOrmEnv<KyselyDb>({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema: {} as KyselyDb,
      migrations: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);\nCREATE UNIQUE INDEX users_email_unique ON users(email);',
    });
    stopEnv = env.stop;
    const raw = env.raw as unknown as SqliteRaw;

    expect(namesOf(raw, 'table'), '1 文目が適用される').toContain('users');
    // 分けずに 1 文として流すと 2 文目が捨てられ、この index は生まれない。
    expect(namesOf(raw, 'index'), '2 文目も適用される').toContain('users_email_unique');
    // 台帳は folder 経路だけが作る。 inline なのに残っていたら経路を取り違えている。
    expect(namesOf(raw, 'table'), 'inline 経路は台帳を作らない').not.toContain('kysely_migration');

    // 組み立てた Kysely から実際に読める形になっている。
    await env.db.insertInto('users').values({ id: 1, email: 'a@example.com' }).execute();
    const rows = await env.db.selectFrom('users').selectAll().execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe('a@example.com');
  });

  it('T-MMS-102 文字列の配列は前から順に適用する', async () => {
    // 配列の 2 要素目が 1 要素目の表に依存する。 順序が入れ替わると落ちる。
    const env = await setupOrmEnv<KyselyDb>({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema: {} as KyselyDb,
      migrations: [
        'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);',
        'CREATE UNIQUE INDEX users_email_unique ON users(email);',
      ],
    });
    stopEnv = env.stop;
    const raw = env.raw as unknown as SqliteRaw;

    expect(namesOf(raw, 'table')).toContain('users');
    expect(namesOf(raw, 'index')).toContain('users_email_unique');
  });

  it('T-MMS-103 空文になる区切りは読み飛ばす', async () => {
    // 末尾の `;` と空行で空の文が生まれる。 そのまま流すと SQLite が落ちる。
    const env = await setupOrmEnv<KyselyDb>({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema: {} as KyselyDb,
      migrations: '\n\nCREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);\n\n;\n\n',
    });
    stopEnv = env.stop;
    const raw = env.raw as unknown as SqliteRaw;

    expect(namesOf(raw, 'table')).toContain('users');
  });
});
