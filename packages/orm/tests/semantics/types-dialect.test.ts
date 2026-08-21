import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  type NeutralEventName,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

/**
 * `backendEventName` が返す名前そのものを検証する test。
 *
 * 既存の axis test は `step.backendEvent` を `backendEventName(...)` の戻り値と
 * 突き合わせている。 両辺が同じ表を引くため、 表の中身を書き換えても両辺が一緒に動いて
 * 落ちない。 実際、 変異試験では `semantics/types.js` の値を空文字にする変異が 155 件
 * すべて生き残っていた。
 *
 * ここでは表を経由しない性質 (形式 / 未定義時の fallback / backend 間の関係 /
 * provider 上書き) を観測点にする。
 */

/**
 * neutral event の全件。 `Record<NeutralEventName, true>` にすることで **型が網羅を強制する**
 * = union に足して本 table に書き忘れると compile が落ち、 union から消すと余剰 key として落ちる。
 * 件数を数字で書かずに済むため、 event が増減しても本 file の数値を直す必要がない。
 */
const NEUTRAL_EVENTS: Record<NeutralEventName, true> = {
  // replication
  'replication.primary-write': true,
  'replication.replica-lagged': true,
  'replication.failover-started': true,
  'replication.promoted': true,
  // cdc
  'cdc.decoded': true,
  'cdc.outbox-appended': true,
  'cdc.event-ordered': true,
  'cdc.at-least-once-delivered': true,
  // logical
  'logical.publication-created': true,
  'logical.subscription-synced': true,
  'logical.conflict-resolved': true,
  'logical.heartbeat': true,
  // mvcc
  'mvcc.snapshot-taken': true,
  'mvcc.serializable-aborted': true,
  'mvcc.phantom-blocked': true,
  'mvcc.deadlock-detected': true,
  // rls
  'rls.policy-installed': true,
  'rls.tenant-isolated': true,
  'rls.bypass-used': true,
  'rls.audit-logged': true,
  // pool
  'pool.acquired': true,
  'pool.idle-timeout': true,
  'pool.statement-timeout': true,
  'pool.wait-queued': true,
  // partition
  'partition.declared': true,
  'partition.pruned': true,
  'partition.wise-joined': true,
  'partition.route-selected': true,
  // vector
  'vector.indexed': true,
  'vector.knn-searched': true,
  'vector.hybrid-searched': true,
  'vector.distance-computed': true,
  // logical-advanced
  'logical-advanced.streaming-started': true,
  'logical-advanced.origin-tracked': true,
  'logical-advanced.two-safe-confirmed': true,
  'logical-advanced.cascade-synced': true,
  // mvcc-advanced
  'mvcc-advanced.tuple-visibility-checked': true,
  'mvcc-advanced.bloat-measured': true,
  'mvcc-advanced.hot-updated': true,
  'mvcc-advanced.xid-wraparound-detected': true,
  // cluster
  'cluster.member-joined': true,
  'cluster.primary-elected': true,
  'cluster.conflict-detected': true,
  'cluster.member-left': true,
  // binlog
  'binlog.position-advanced': true,
  'binlog.gtid-set-updated': true,
  'binlog.format-negotiated': true,
  'binlog.gap-detected': true,
  // wal
  'wal.checkpoint-triggered': true,
  'wal.size-threshold-crossed': true,
  'wal.shared-memory-mapped': true,
  'wal.journal-mode-switched': true,
  // fts5
  'fts5.virtual-table-created': true,
  'fts5.tokenized': true,
  'fts5.matched': true,
  'fts5.vocab-inspected': true,
  // txn
  'txn.level-set': true,
  'txn.dirty-read-blocked': true,
  'txn.non-repeatable-read-blocked': true,
  'txn.phantom-read-blocked': true,
  // pool-advanced
  'pool-advanced.health-checked': true,
  'pool-advanced.warmed-up': true,
  'pool-advanced.drained': true,
  'pool-advanced.metrics-exported': true,
  // pglr
  'pglr.publication-created': true,
  'pglr.slot-allocated': true,
  'pglr.subscription-synced': true,
  'pglr.streaming': true,
  'pglr.disconnected': true,
};

const ALL_NEUTRAL = Object.keys(NEUTRAL_EVENTS) as NeutralEventName[];
const BACKENDS: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];
const PROVIDERS: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const SQLITE_SERVER_ONLY_AXES = ['cdc', 'logical', 'replication'] as const;

/**
 * event 名として使える形。 英小文字 / 数字で始まり、 区切りは `.` `_` `-` のみ。
 *
 * 空文字を弾くのが要点。 `backendEventName` の fallback は `??` なので、
 * **表の値が空文字でも fallback しない** (空文字は nullish ではない)。
 * 表の値が壊れた時に neutral 名へ戻ってくれる、 という保護は存在しない。
 */
const EVENT_NAME_FORM = /^[a-z0-9][a-z0-9._-]*$/;

/** その backend が方言を持たない (= neutral 名がそのまま返る) event。 */
function missingDialect(backend: OrmBackend): NeutralEventName[] {
  return ALL_NEUTRAL.filter((neutral) => backendEventName(backend, neutral) === neutral);
}

/**
 * backend 内で 2 つの neutral event が同じ名前を共有してよい場合の allowlist。
 *
 * MySQL Group Replication は「replica の昇格」 と「cluster の primary 選出」 を
 * 同じ event で表すため、 2 つの semantic が 1 つの名前を共有する。
 * 意図した共有なのでここに書くが、 **書いたものが実際に共有されていることも検査する**
 * = 実態が変わって共有が解消されたら本 allowlist も消す必要がある。
 */
const SHARED_BACKEND_NAMES: Partial<Record<OrmBackend, readonly string[]>> = {
  mysql: ['group_replication.primary_elected'],
};

/**
 * Prisma が自分の label で出す event。
 *
 * source の doc comment が「override を持つのは Prisma だけ」 と定めており、
 * downstream は `prisma.pool.acquired` のような名前で assertion を書く。
 * 消えると利用者側の test が黙って別の名前を見ることになるため、 契約として固定する。
 */
const PRISMA_OVERRIDES: NeutralEventName[] = [
  'mvcc.snapshot-taken',
  'pool.acquired',
  'pool.wait-queued',
];

/** provider を渡した時に結果が変わる event を集める。 */
function overriddenBy(provider: OrmProvider, backend: OrmBackend): NeutralEventName[] {
  return ALL_NEUTRAL.filter(
    (neutral) => backendEventName(backend, neutral, provider) !== backendEventName(backend, neutral),
  );
}

describe('backendEventName — 返す名前そのものの性質', () => {
  it('T-ORM-TY-001 全 backend × 全 neutral event を実際に走査できている', () => {
    expect(ALL_NEUTRAL.length, 'neutral event を 1 件も列挙できていない').toBeGreaterThan(0);
    const measured = BACKENDS.flatMap((backend) =>
      ALL_NEUTRAL.map((neutral) => backendEventName(backend, neutral)),
    );
    expect(measured).toHaveLength(BACKENDS.length * ALL_NEUTRAL.length);
  });

  it('T-ORM-TY-002 全 pair が event 名の形をしている (空文字を返さない)', () => {
    const broken: string[] = [];
    for (const backend of BACKENDS) {
      for (const neutral of ALL_NEUTRAL) {
        const name = backendEventName(backend, neutral);
        if (!EVENT_NAME_FORM.test(name)) broken.push(`${backend}/${neutral} -> ${JSON.stringify(name)}`);
      }
    }
    expect(broken).toStrictEqual([]);
  });

  it('T-ORM-TY-003 provider 付きでも event 名の形を保つ', () => {
    const broken: string[] = [];
    for (const provider of PROVIDERS) {
      for (const backend of BACKENDS) {
        for (const neutral of ALL_NEUTRAL) {
          const name = backendEventName(backend, neutral, provider);
          if (!EVENT_NAME_FORM.test(name)) {
            broken.push(`${provider}/${backend}/${neutral} -> ${JSON.stringify(name)}`);
          }
        }
      }
    }
    expect(broken).toStrictEqual([]);
  });

  it('T-ORM-TY-004 方言を持たない event は neutral 名をそのまま返す', () => {
    const serverOnly = ALL_NEUTRAL.filter((neutral) =>
      SQLITE_SERVER_ONLY_AXES.some((axis) => neutral.startsWith(`${axis}.`)),
    );
    expect(serverOnly.length, 'sqlite で fallback する event が 1 件も無い').toBeGreaterThan(0);
    for (const neutral of serverOnly) {
      expect(backendEventName('sqlite', neutral)).toBe(neutral);
    }
  });

  it('T-ORM-TY-005 postgres と mysql は同じ event 集合に方言を持つ', () => {
    // doc comment は「SQLite だけが partial」 と定める。 pg と mysql は揃っているはず。
    expect(missingDialect('postgres')).toStrictEqual(missingDialect('mysql'));
  });

  it('T-ORM-TY-006 sqlite の欠落は server-only の axis に限られる', () => {
    const serverOnly = missingDialect('postgres');
    const sqliteOnly = missingDialect('sqlite').filter((n) => !serverOnly.includes(n));
    expect(sqliteOnly.length, 'sqlite だけが欠く event が 1 件も無い').toBeGreaterThan(0);
    // sqlite に server 側の複製機構が無いことが理由。 それ以外の axis が欠けていたら設計が変わっている。
    const axes = [...new Set(sqliteOnly.map((n) => n.split('.')[0]))].sort();
    expect(axes).toStrictEqual(SQLITE_SERVER_ONLY_AXES);
  });

  it('T-ORM-TY-007 backend 内で 2 つの event が同じ名前を共有しない (既知の共有を除く)', () => {
    for (const backend of BACKENDS) {
      const owner = new Map<string, NeutralEventName>();
      const collisions: string[] = [];
      for (const neutral of ALL_NEUTRAL) {
        const name = backendEventName(backend, neutral);
        const first = owner.get(name);
        if (first === undefined) owner.set(name, neutral);
        else collisions.push(`${name} (${first} / ${neutral})`);
      }
      const allowed = SHARED_BACKEND_NAMES[backend] ?? [];
      const unexpected = collisions.filter((c) => !allowed.some((name) => c.startsWith(`${name} (`)));
      expect(unexpected, `${backend} で意図しない名前の共有がある`).toStrictEqual([]);
      // allowlist が実態と合っているか。 共有が解消されたら allowlist も消す。
      for (const name of allowed) {
        expect(
          collisions.some((c) => c.startsWith(`${name} (`)),
          `${backend} の allowlist ${name} は共有されていない (allowlist が古い)`,
        ).toBe(true);
      }
    }
  });

  it('T-ORM-TY-008 方言を持つ event は 3 backend が全一致しない', () => {
    const withDialect = ALL_NEUTRAL.filter((n) => !missingDialect('postgres').includes(n));
    expect(withDialect.length, '方言を持つ event が 1 件も無い').toBeGreaterThan(0);
    const allSame = withDialect.filter(
      (neutral) => new Set(BACKENDS.map((b) => backendEventName(b, neutral))).size === 1,
    );
    expect(allSame, '方言を持つのに 3 backend が同じ名前になっている').toStrictEqual([]);
  });
});

describe('backendEventName — provider overlay', () => {
  it('T-ORM-TY-101 prisma は全 backend で同じ event 集合を上書きする', () => {
    for (const backend of BACKENDS) {
      expect(overriddenBy('prisma', backend).sort()).toStrictEqual([...PRISMA_OVERRIDES].sort());
    }
  });

  it('T-ORM-TY-102 prisma の上書き値は prisma. で始まる', () => {
    for (const backend of BACKENDS) {
      for (const neutral of PRISMA_OVERRIDES) {
        expect(backendEventName(backend, neutral, 'prisma').startsWith('prisma.')).toBe(true);
      }
    }
  });

  it('T-ORM-TY-103 drizzle と kysely は provider 無しと同じ結果を返す', () => {
    for (const provider of ['drizzle', 'kysely'] as OrmProvider[]) {
      for (const backend of BACKENDS) {
        expect(overriddenBy(provider, backend), `${provider} が結果を変えている`).toStrictEqual([]);
      }
    }
  });

  it('T-ORM-TY-104 上書き対象外の event は provider を渡しても変わらない', () => {
    const untouched = ALL_NEUTRAL.filter((n) => !PRISMA_OVERRIDES.includes(n));
    expect(untouched.length, '上書き対象外の event が 1 件も無い').toBeGreaterThan(0);
    for (const backend of BACKENDS) {
      for (const neutral of untouched) {
        expect(backendEventName(backend, neutral, 'prisma')).toBe(backendEventName(backend, neutral));
      }
    }
  });
});
