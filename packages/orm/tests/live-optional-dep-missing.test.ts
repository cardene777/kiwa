/**
 * live 経路 6 本が「必要な package が入っていない」 と判断した時の案内文の検査 (Issue #2170)。
 *
 * 6 本とも coverage 上 **実行回数 0** だった。 案内文は install する package 名と
 * `pnpm add -D` の 1 行を含む長文で、 経路ごとに中身が違う。 文面が実装と食い違っても
 * 誰も気付けない状態だった。
 *
 * ## なぜこの状態を作れるか
 *
 * `@testcontainers/postgresql` と `@testcontainers/mysql` は `peerDependenciesMeta` で
 * **optional** に指定されている。 入れずに使う利用者が実際に居る前提の依存で、
 * その時 `await import(...)` は「見つからない」 で reject する。 差し替えで作るのは
 * その状態そのものであって、 到達できない状態の偽装ではない。
 *
 * ## 何を差し替えるか
 *
 * container の 2 package だけ。 6 本とも container の import を最初に置いているため、
 * この 2 つが解決できなければ 6 本すべてが案内文へ倒れる。 driver 側 (`postgres` /
 * `mysql2` / `pg` / `drizzle-orm` / `kysely`) は実物のまま置く。
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@testcontainers/postgresql', () => {
  throw new Error("Cannot find package '@testcontainers/postgresql'");
});
vi.mock('@testcontainers/mysql', () => {
  throw new Error("Cannot find package '@testcontainers/mysql'");
});

/**
 * `await import(...)` が実際に返す理由を先に採る。
 *
 * 案内文へ埋め込むのはこの文字列で、 実装は `caught.message` をそのまま繋ぐ。
 * 文言を検査側で決め打ちにすると、 実装が理由を落として別の定数を繋いでも気付けない。
 * 同じ import を自分でも 1 度失敗させ、 その結果と突き合わせる。
 *
 * specifier は literal で書く。 変数にすると差し替えが当たらず、 import が成功して
 * 空文字になり、 以降の `toContain('')` が何も検査しなくなる (下の T-DEP-000 で固定)。
 */
const toReason = (caught: unknown): string => String((caught as Error).message);
const PG_IMPORT_REASON = await import('@testcontainers/postgresql').then(() => '', toReason);
const MYSQL_IMPORT_REASON = await import('@testcontainers/mysql').then(() => '', toReason);

const { setupOrmEnv } = await import('../src/index.js');

/** 実装は overload で組合せを絞るため、 検査側は union を外して渡す。 */
async function callWith(opts: Record<string, unknown>): Promise<unknown> {
  return setupOrmEnv(opts as unknown as Parameters<typeof setupOrmEnv>[0]);
}

/** reject した Error の文面を取り出す。 解決してしまった形は空文字で落とす。 */
async function messageOf(opts: Record<string, unknown>): Promise<string> {
  return callWith(opts).then(
    () => '',
    (caught: unknown) => String((caught as Error).message),
  );
}

class DummyPrismaClient {
  constructor(public readonly opts: { datasourceUrl: string }) {}
}

describe('setupOrmEnv — container package が入っていない時の案内 (#2170)', () => {
  it('T-DEP-000 前提 = container の import は実際に失敗している', () => {
    // ここが空だと、 以降の「理由が埋め込まれる」 の検査が全て素通りする。
    expect(PG_IMPORT_REASON.length, 'postgres 側の import が失敗している').toBeGreaterThan(0);
    expect(MYSQL_IMPORT_REASON.length, 'mysql 側の import が失敗している').toBeGreaterThan(0);
  });

  it('T-DEP-001 drizzle + postgres は 3 package と install 行を案内する', async () => {
    const message = await messageOf({ mode: 'live', orm: 'drizzle', dialect: 'postgres', schema: {} });

    expect(message, '案内は @kiwa-lab/orm の名前で始まる').toContain('@kiwa-lab/orm: live mode requires');
    // 足りない可能性がある 3 つを全て並べる。 1 つでも落ちると利用者は残りを自力で探す。
    expect(message).toContain("'@testcontainers/postgresql'");
    expect(message).toContain("'postgres'");
    expect(message).toContain("'drizzle-orm/postgres-js'");
    // そのまま貼れる 1 行。 package 名の並びが install 行と揃っていないと動かない。
    expect(message).toContain('pnpm add -D @testcontainers/postgresql postgres drizzle-orm');
    // 元の理由を落とすと、 何が見つからなかったのか分からない。
    expect(message).toContain('Original error: ');
    expect(message).toContain(PG_IMPORT_REASON);
  });

  it('T-DEP-002 drizzle + mysql は mysql 側の 3 package を案内する', async () => {
    const message = await messageOf({ mode: 'live', orm: 'drizzle', dialect: 'mysql', schema: {} });

    expect(message).toContain('@kiwa-lab/orm: live MySQL mode requires');
    expect(message).toContain("'@testcontainers/mysql'");
    expect(message).toContain("'mysql2'");
    expect(message).toContain("'drizzle-orm/mysql2'");
    expect(message).toContain('pnpm add -D @testcontainers/mysql mysql2 drizzle-orm');
    expect(message).toContain(MYSQL_IMPORT_REASON);
    // postgres 側の案内に化けていないことを見る。
    expect(message).not.toContain('@testcontainers/postgresql');
  });

  it('T-DEP-003 prisma + postgres は container 1 package だけを案内する', async () => {
    const message = await messageOf({
      mode: 'live',
      orm: 'prisma',
      dialect: 'postgres',
      prismaClient: DummyPrismaClient,
      schemaPath: '/tmp/schema.prisma',
    });

    expect(message).toContain('@kiwa-lab/orm: live Prisma Postgres mode requires');
    // prisma 経路は driver を自前で持たないので、 案内するのは container だけ。
    expect(message).toContain("'@testcontainers/postgresql'");
    expect(message).toContain('pnpm add -D @testcontainers/postgresql');
    expect(message, 'driver は要らないので並べない').not.toContain("'postgres'");
    expect(message).not.toContain('drizzle-orm');
    expect(message).toContain(PG_IMPORT_REASON);
  });

  it('T-DEP-004 prisma + mysql は mysql の container を案内する', async () => {
    const message = await messageOf({
      mode: 'live',
      orm: 'prisma',
      dialect: 'mysql',
      prismaClient: DummyPrismaClient,
      schemaPath: '/tmp/schema.prisma',
    });

    expect(message).toContain('@kiwa-lab/orm: live Prisma MySQL mode requires');
    expect(message).toContain("'@testcontainers/mysql'");
    expect(message).toContain('pnpm add -D @testcontainers/mysql');
    expect(message, 'driver は要らないので並べない').not.toContain("'mysql2'");
    expect(message).toContain(MYSQL_IMPORT_REASON);
  });

  it('T-DEP-005 kysely + postgres は pg と kysely も並べる', async () => {
    const message = await messageOf({ mode: 'live', orm: 'kysely', dialect: 'postgres' });

    expect(message).toContain('@kiwa-lab/orm: live Kysely (Postgres) mode requires');
    // kysely 経路の driver は `pg` (drizzle 側の `postgres` ではない)。
    expect(message).toContain("'pg'");
    expect(message).toContain("'kysely'");
    expect(message).toContain('pnpm add -D @testcontainers/postgresql pg kysely');
    expect(message, 'drizzle 側の driver 名に化けない').not.toContain('postgres-js');
    expect(message).toContain(PG_IMPORT_REASON);
  });

  it('T-DEP-006 kysely + mysql は mysql2 と kysely を並べる', async () => {
    const message = await messageOf({ mode: 'live', orm: 'kysely', dialect: 'mysql' });

    expect(message).toContain('@kiwa-lab/orm: live Kysely (MySQL) mode requires');
    expect(message).toContain("'mysql2'");
    expect(message).toContain("'kysely'");
    expect(message).toContain('pnpm add -D @testcontainers/mysql mysql2 kysely');
    expect(message, 'drizzle 側の driver 名に化けない').not.toContain('drizzle-orm/mysql2');
    expect(message).toContain(MYSQL_IMPORT_REASON);
  });

  it('T-DEP-007 6 経路の案内は互いに入れ替わらない', async () => {
    // 1 件ずつ順に走らせる。 同時に走らせると差し替えの解決が返らない
    // (失敗する factory は結果を cache しないため、 同時要求が互いを待つ)。
    const cases: Record<string, unknown>[] = [
      { mode: 'live', orm: 'drizzle', dialect: 'postgres', schema: {} },
      { mode: 'live', orm: 'drizzle', dialect: 'mysql', schema: {} },
      {
        mode: 'live',
        orm: 'prisma',
        dialect: 'postgres',
        prismaClient: DummyPrismaClient,
        schemaPath: '/tmp/schema.prisma',
      },
      {
        mode: 'live',
        orm: 'prisma',
        dialect: 'mysql',
        prismaClient: DummyPrismaClient,
        schemaPath: '/tmp/schema.prisma',
      },
      { mode: 'live', orm: 'kysely', dialect: 'postgres' },
      { mode: 'live', orm: 'kysely', dialect: 'mysql' },
    ];
    const messages: string[] = [];
    for (const opts of cases) {
      messages.push(await messageOf(opts));
    }

    expect(messages, '6 経路とも試す').toHaveLength(6);
    expect(messages.filter((m) => m === ''), '6 経路とも案内へ倒れる').toHaveLength(0);
    expect(new Set(messages).size, '6 つとも別の文面').toBe(6);
  });
});
