/**
 * `setupOrmEnv` の入口が「組合せを受け付けない」 と判断する 3 経路の検査 (Issue #2170)。
 *
 * 3 経路とも coverage 上 **実行回数 0** だった。 adapter ごとに対応表が違うため、
 * 案内文も 3 種類ある。 受け付けない組合せを渡した時に **どの対応表を案内するか** が
 * 入れ替わっても、 単に「投げる」 だけを見る検査では気付けない。
 *
 * ここでは差し替えを 1 つも使わない。 どの adapter にも到達しない組合せを渡すだけで
 * この 3 経路に入るため、 外部依存を起こす手前で判断が終わる。
 */
import { describe, expect, it } from 'vitest';
import { setupOrmEnv } from '../src/index.js';

/** 実装は overload で組合せを絞るため、 検査側は union を外して渡す。 */
async function callWith(opts: Record<string, unknown>): Promise<unknown> {
  return setupOrmEnv(opts as unknown as Parameters<typeof setupOrmEnv>[0]);
}

describe('setupOrmEnv — 受け付けない組合せの案内 (#2170)', () => {
  it('T-DSP-001 prisma の未対応な組合せは prisma の対応表を案内する', async () => {
    // prisma は mock+sqlite / live+postgres / live+mysql の 3 つだけ。
    // live+sqlite はどれにも当たらない。
    const err = await callWith({ mode: 'live', orm: 'prisma', dialect: 'sqlite' }).then(
      () => null,
      (caught: unknown) => caught as Error,
    );

    expect(err, 'この組合せは受け付けない').toBeInstanceOf(Error);
    const message = String(err?.message);
    expect(message, '受け取った mode をそのまま返す').toContain("received mode='live'");
    expect(message, '受け取った dialect をそのまま返す').toContain("dialect='sqlite'");
    // prisma の対応表 3 件が全て並ぶ。 1 件でも欠けると利用者は残りを試せない。
    expect(message).toContain("mode='mock'+dialect='sqlite'");
    expect(message).toContain("mode='live'+dialect='postgres'");
    expect(message).toContain("mode='live'+dialect='mysql'");
    // kysely / drizzle の案内に化けていないことを見る。
    expect(message, 'prisma の案内であることを名指しする').toContain('prisma adapter');
    expect(message).not.toContain('kysely adapter');
    expect(message).not.toContain('unsupported combination');
  });

  it('T-DSP-002 kysely の未対応な組合せは kysely の対応表を案内する', async () => {
    // kysely は mock+sqlite / live+postgres / live+mysql。 mock+postgres は無い。
    const err = await callWith({ mode: 'mock', orm: 'kysely', dialect: 'postgres' }).then(
      () => null,
      (caught: unknown) => caught as Error,
    );

    expect(err).toBeInstanceOf(Error);
    const message = String(err?.message);
    expect(message, 'kysely の案内であることを名指しする').toContain('kysely adapter');
    expect(message).toContain('mock+sqlite / live+postgres / live+mysql');
    expect(message).toContain("received mode='mock'");
    expect(message).toContain("dialect='postgres'");
    expect(message).not.toContain('prisma adapter');
  });

  it('T-DSP-003 drizzle の未対応な組合せは 3 値を並べて README へ送る', async () => {
    // drizzle は mock+sqlite / live+postgres / live+mysql。 mock+postgres は無い。
    const err = await callWith({ mode: 'mock', orm: 'drizzle', dialect: 'postgres' }).then(
      () => null,
      (caught: unknown) => caught as Error,
    );

    expect(err).toBeInstanceOf(Error);
    const message = String(err?.message);
    // drizzle 側だけ orm も並べる (prisma / kysely は orm が確定しているため出さない)。
    expect(message).toContain("mode='mock'");
    expect(message).toContain("orm='drizzle'");
    expect(message).toContain("dialect='postgres'");
    expect(message, '対応表の代わりに README へ送る').toContain('See README for the supported matrix');
    expect(message).not.toContain('prisma adapter');
    expect(message).not.toContain('kysely adapter');
  });

  it('T-DSP-004 3 経路の案内は互いに入れ替わらない', async () => {
    // 同じ dialect='postgres' で orm だけを変えて、案内が 3 通りに割れることを見る。
    // 1 つの案内に畳まれていると、利用者はどの対応表を見ればよいか分からない。
    const messages = await Promise.all(
      (['prisma', 'kysely', 'drizzle'] as const).map(async (orm) =>
        callWith({ mode: 'mock', orm, dialect: 'postgres' }).then(
          () => '',
          (caught: unknown) => String((caught as Error).message),
        ),
      ),
    );

    expect(messages[0], 'prisma').toContain('prisma adapter');
    expect(messages[1], 'kysely').toContain('kysely adapter');
    expect(messages[2], 'drizzle').toContain('unsupported combination');
    expect(new Set(messages).size, '3 つとも別の文面').toBe(3);
  });
});
