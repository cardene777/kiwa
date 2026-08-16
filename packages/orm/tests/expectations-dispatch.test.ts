/**
 * `src/expectations.ts` の振り分けを覆う検査 (Issue #1941)。
 *
 * `expectQuery` と `expectRowCount` は `env.mode` / `env.dialect` / `env.orm` の
 * 3 つで経路を選び、それぞれ違う方法で行を取り出す。 drizzle 経路は実 DB を使う
 * 検査で通っているが、prisma の 3 経路 (mock / postgres / mysql) と kysely の
 * postgres 経路は 1 度も呼ばれていなかった。
 *
 * これらは `env.client` / `env.raw` を cast 越しに使うだけなので、形だけ合わせた
 * 相手を渡せば通る。 実 DB も Docker も要らない。
 *
 * ## 何を確かめているか
 *
 * 2 点ある。 **どの相手から行を取り出したか** と、**組み立てた SQL** 。
 *
 * 前者は経路ごとに取り出し方が違うため (prisma は `$queryRawUnsafe` の戻り値、
 * kysely は `query()` の `rows`、mysql2 は `[rows, fields]` の 1 つ目)。
 * 後者は識別子の囲み方が方言で変わり、囲み忘れると値によって壊れるため。
 *
 * 比較そのものは呼び出し側の `expect` に委ねる設計なので、検査側は
 * 「何と何を比べようとしたか」 を記録する `expect` を渡して確かめる。
 */
import { describe, expect, it } from 'vitest';
import { expectQuery, expectRowCount, type MinimalExpect } from '../src/expectations.js';
import type { OrmTestEnv } from '../src/types.js';

interface RecordedComparison {
  actual: unknown;
  matcher: 'toEqual' | 'toBe';
  expected: unknown;
}

/** 比較の中身を記録するだけの `expect`。 実装が何を比べたかを見るために使う。 */
function recordingExpect(): MinimalExpect & { calls: RecordedComparison[] } {
  const calls: RecordedComparison[] = [];
  const fn = ((actual: unknown) => ({
    toEqual(expected: unknown) {
      calls.push({ actual, matcher: 'toEqual', expected });
    },
    toBe(expected: unknown) {
      calls.push({ actual, matcher: 'toBe', expected });
    },
  })) as MinimalExpect & { calls: RecordedComparison[] };
  fn.calls = calls;
  return fn;
}

/** `$queryRawUnsafe` を持つ相手。 prisma の 3 経路が使う。 */
function prismaClient(rows: unknown[]) {
  const seen: string[] = [];
  return {
    seen,
    client: {
      $queryRawUnsafe: async (sql: string) => {
        seen.push(sql);
        return rows;
      },
    },
  };
}

/** `query()` が `{ rows }` を返す相手。 kysely の postgres 経路が使う。 */
function pgPool(rows: unknown[]) {
  const seen: string[] = [];
  return {
    seen,
    raw: {
      query: async (sql: string) => {
        seen.push(sql);
        return { rows };
      },
    },
  };
}

/** `query()` が `[rows, fields]` を返す相手。 mysql2 の経路が使う。 */
function mysqlPool(rows: unknown[]) {
  const seen: string[] = [];
  return {
    seen,
    raw: {
      query: async (sql: string) => {
        seen.push(sql);
        return [rows, []];
      },
    },
  };
}

describe('expectQuery — 経路ごとの取り出し方', () => {
  it('mock + prisma は client の生 SQL 実行から取り出す', async () => {
    const rows = [{ id: 1 }];
    const { client, seen } = prismaClient(rows);
    const env = { mode: 'mock', orm: 'prisma', client } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectQuery(env, 'SELECT 1', rows, rec);

    expect(seen).toEqual(['SELECT 1']);
    expect(rec.calls).toEqual([{ actual: rows, matcher: 'toEqual', expected: rows }]);
  });

  it('postgres + prisma は client の生 SQL 実行から取り出す', async () => {
    const rows = [{ id: 2 }];
    const { client, seen } = prismaClient(rows);
    const env = {
      mode: 'live',
      dialect: 'postgres',
      orm: 'prisma',
      client,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectQuery(env, 'SELECT 2', rows, rec);

    expect(seen).toEqual(['SELECT 2']);
    expect(rec.calls).toEqual([{ actual: rows, matcher: 'toEqual', expected: rows }]);
  });

  it('postgres + kysely は query の結果から rows を取り出す', async () => {
    const rows = [{ id: 3 }];
    const { raw, seen } = pgPool(rows);
    const env = {
      mode: 'live',
      dialect: 'postgres',
      orm: 'kysely',
      raw,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectQuery(env, 'SELECT 3', rows, rec);

    expect(seen).toEqual(['SELECT 3']);
    // `{ rows }` の中身を渡す。 包んだままだと比較が常に外れる。
    expect(rec.calls).toEqual([{ actual: rows, matcher: 'toEqual', expected: rows }]);
  });

  it('mysql + prisma は client の生 SQL 実行から取り出す', async () => {
    const rows = [{ id: 4 }];
    const { client, seen } = prismaClient(rows);
    const env = {
      mode: 'live',
      dialect: 'mysql',
      orm: 'prisma',
      client,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectQuery(env, 'SELECT 4', rows, rec);

    expect(seen).toEqual(['SELECT 4']);
    expect(rec.calls).toEqual([{ actual: rows, matcher: 'toEqual', expected: rows }]);
  });

  it('mysql + kysely は [rows, fields] の 1 つ目を取り出す', async () => {
    const rows = [{ id: 5 }];
    const { raw, seen } = mysqlPool(rows);
    const env = {
      mode: 'live',
      dialect: 'mysql',
      orm: 'kysely',
      raw,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectQuery(env, 'SELECT 5', rows, rec);

    expect(seen).toEqual(['SELECT 5']);
    // 配列ごと渡すと `[rows, fields]` と比べることになる。 1 つ目だけを取る。
    expect(rec.calls).toEqual([{ actual: rows, matcher: 'toEqual', expected: rows }]);
  });
});

describe('expectRowCount — 経路ごとの取り出し方と識別子の囲み', () => {
  it('mock + prisma は識別子を二重引用符で囲む', async () => {
    const { client, seen } = prismaClient([{ c: 7 }]);
    const env = { mode: 'mock', orm: 'prisma', client } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectRowCount(env, 'users', 7, rec);

    expect(seen).toEqual(['SELECT COUNT(*) AS c FROM "users"']);
    expect(rec.calls).toEqual([{ actual: 7, matcher: 'toBe', expected: 7 }]);
  });

  it('mock + prisma は識別子に含まれる二重引用符を重ねて無害化する', async () => {
    const { client, seen } = prismaClient([{ c: 0 }]);
    const env = { mode: 'mock', orm: 'prisma', client } as unknown as OrmTestEnv;

    await expectRowCount(env, 'we"ird', 0, recordingExpect());

    expect(seen).toEqual(['SELECT COUNT(*) AS c FROM "we""ird"']);
  });

  it('mock + prisma は bigint の件数を数値に直してから比べる', async () => {
    // prisma の COUNT は driver によって bigint で返る。 そのまま比べると
    // `7n === 7` が偽になり、正しい件数でも落ちる。
    const { client } = prismaClient([{ c: 7n }]);
    const env = { mode: 'mock', orm: 'prisma', client } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectRowCount(env, 'users', 7, rec);

    expect(rec.calls).toEqual([{ actual: 7, matcher: 'toBe', expected: 7 }]);
    expect(typeof rec.calls[0]?.actual).toBe('number');
  });

  it('postgres + prisma は件数を int にして取り出す', async () => {
    const { client, seen } = prismaClient([{ c: 3 }]);
    const env = {
      mode: 'live',
      dialect: 'postgres',
      orm: 'prisma',
      client,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectRowCount(env, 'users', 3, rec);

    expect(seen).toEqual(['SELECT COUNT(*)::int AS c FROM "users"']);
    expect(rec.calls).toEqual([{ actual: 3, matcher: 'toBe', expected: 3 }]);
  });

  it('postgres + kysely は query の結果の rows から取り出す', async () => {
    const { raw, seen } = pgPool([{ c: 4 }]);
    const env = {
      mode: 'live',
      dialect: 'postgres',
      orm: 'kysely',
      raw,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectRowCount(env, 'users', 4, rec);

    expect(seen).toEqual(['SELECT COUNT(*)::int AS c FROM "users"']);
    expect(rec.calls).toEqual([{ actual: 4, matcher: 'toBe', expected: 4 }]);
  });

  it('mysql + prisma は識別子を逆引用符で囲む', async () => {
    const { client, seen } = prismaClient([{ c: 5 }]);
    const env = {
      mode: 'live',
      dialect: 'mysql',
      orm: 'prisma',
      client,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectRowCount(env, 'users', 5, rec);

    expect(seen).toEqual(['SELECT COUNT(*) AS c FROM `users`']);
    expect(rec.calls).toEqual([{ actual: 5, matcher: 'toBe', expected: 5 }]);
  });

  it('mysql + prisma は識別子に含まれる逆引用符を重ねて無害化する', async () => {
    const { client, seen } = prismaClient([{ c: 0 }]);
    const env = {
      mode: 'live',
      dialect: 'mysql',
      orm: 'prisma',
      client,
    } as unknown as OrmTestEnv;

    await expectRowCount(env, 'we`ird', 0, recordingExpect());

    expect(seen).toEqual(['SELECT COUNT(*) AS c FROM `we``ird`']);
  });

  it('mysql + kysely は [rows, fields] の 1 つ目から取り出す', async () => {
    const { raw, seen } = mysqlPool([{ c: 6n }]);
    const env = {
      mode: 'live',
      dialect: 'mysql',
      orm: 'kysely',
      raw,
    } as unknown as OrmTestEnv;
    const rec = recordingExpect();

    await expectRowCount(env, 'users', 6, rec);

    expect(seen).toEqual(['SELECT COUNT(*) AS c FROM `users`']);
    // ここも bigint で返りうるため数値に直してから比べる。
    expect(rec.calls).toEqual([{ actual: 6, matcher: 'toBe', expected: 6 }]);
    expect(typeof rec.calls[0]?.actual).toBe('number');
  });
});
