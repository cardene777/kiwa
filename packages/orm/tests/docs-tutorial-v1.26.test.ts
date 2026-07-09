/**
 * v1.26-5 docs 補強 (Issue #944) — tutorial 47-49 code snippet 検証。
 *
 * `docs/tutorials/47-postgres-cdc-outbox.md` /
 * `docs/tutorials/48-mysql-rls-tenant.md` /
 * `docs/tutorials/49-vector-search-pgvector.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 / v1.25 の docs-tutorial-v*.test.ts と同 pattern。
 *
 * v1.26 は @kiwa-lab/orm v0.9 の 8 axis advanced db semantics を扱う。
 * tutorial 3 本は cdc / rls / vector-store の 3 axis を各 1 walkthrough で
 * cover するため、 本 test も 3 axis × 各 5-7 snippet ≈ 27 test に focus する。
 */
import { describe, expect, it } from 'vitest';
import {
  appendOutbox,
  buildIndex,
  bypassRls,
  computeDistance,
  confirmDelivery,
  createCdcSession,
  createRlsSession,
  createVectorStoreSession,
  decodeEvent,
  filterTenant,
  hybridSearch,
  installPolicy,
  knnSearch,
  logAudit,
  markEventOrdered,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 47 — Postgres CDC + outbox
// ---------------------------------------------------------------------------

describe('tutorial 47 — session ctor', () => {
  it('starts idle with empty buffers', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    expect(session.state).toBe('idle');
    expect(session.decoded).toHaveLength(0);
    expect(session.outbox).toHaveLength(0);
    expect(session.confirmedLsn).toBe(0);
    expect(session.history).toHaveLength(0);
  });
});

describe('tutorial 47 — decode event', () => {
  it('records the decoded event and moves to decoding', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    const step = decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: { id: '1' } },
    });

    expect(step.neutralEvent).toBe('cdc.decoded');
    expect(step.backendEvent).toBe('pg_logical_slot.decoded');
    expect(step.state).toBe('decoding');
    expect(session.decoded).toHaveLength(1);
    expect(session.decoded[0]?.lsn).toBe(101);
  });

  it('throws when lsn is not positive', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    expect(() =>
      decodeEvent(session, {
        event: { lsn: 0, kind: 'insert', table: 'orders', payload: {} },
      }),
    ).toThrow(/lsn must be positive/);
  });
});

describe('tutorial 47 — outbox append', () => {
  it('moves decoding -> buffered and preserves the event', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: { id: '1' } },
    });

    const step = appendOutbox(session, {});

    expect(step.neutralEvent).toBe('cdc.outbox-appended');
    expect(step.backendEvent).toBe('outbox.wal2json_appended');
    expect(step.state).toBe('buffered');
    expect(session.outbox).toHaveLength(1);
    expect(session.outbox[0]?.lsn).toBe(101);
  });

  it('throws when appending from idle (no decoded event yet)', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });

    expect(() => appendOutbox(session, {})).toThrow(/decoding \/ buffered \/ ordered/);
  });
});

describe('tutorial 47 — LSN ordering', () => {
  it('accepts a strictly increasing outbox', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    for (const lsn of [101, 102, 103]) {
      decodeEvent(session, {
        event: { lsn, kind: 'insert', table: 'orders', payload: {} },
      });
      appendOutbox(session, {});
    }

    const step = markEventOrdered(session);

    expect(step.state).toBe('ordered');
    expect(step.metadata.highWaterLsn).toBe(103);
    expect(step.metadata.outboxSize).toBe(3);
  });

  it('throws on an out-of-order outbox', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, {
      event: { lsn: 103, kind: 'insert', table: 'orders', payload: {} },
    });
    appendOutbox(session, {});
    decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: {} },
    });
    appendOutbox(session, {});

    expect(() => markEventOrdered(session)).toThrow(/LSN out of order/);
  });
});

describe('tutorial 47 — confirm delivery', () => {
  it('advances confirmedLsn and moves to delivered', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    for (const lsn of [101, 102, 103]) {
      decodeEvent(session, {
        event: { lsn, kind: 'insert', table: 'orders', payload: {} },
      });
      appendOutbox(session, {});
    }
    markEventOrdered(session);

    const step = confirmDelivery(session, { upToLsn: 103 });

    expect(step.neutralEvent).toBe('cdc.at-least-once-delivered');
    expect(step.backendEvent).toBe('pg_logical_slot.confirmed_flush');
    expect(step.state).toBe('delivered');
    expect(session.confirmedLsn).toBe(103);
  });

  it('rejects a pointer regression', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: {} },
    });
    appendOutbox(session, {});
    markEventOrdered(session);
    confirmDelivery(session, { upToLsn: 101 });

    expect(() => confirmDelivery(session, { upToLsn: 50 })).toThrow(/regresses/);
  });

  it('rejects a pointer beyond the outbox high-water', () => {
    const session = createCdcSession({
      slotName: 'my_outbox_slot',
      provider: 'drizzle',
      backend: 'postgres',
    });
    decodeEvent(session, {
      event: { lsn: 101, kind: 'insert', table: 'orders', payload: {} },
    });
    appendOutbox(session, {});
    markEventOrdered(session);

    expect(() => confirmDelivery(session, { upToLsn: 500 })).toThrow(
      /exceeds outbox high-water/,
    );
  });
});

// ---------------------------------------------------------------------------
// Tutorial 48 — MySQL RLS + multi-tenant
// ---------------------------------------------------------------------------

describe('tutorial 48 — session ctor', () => {
  it('starts at no-policy with an empty audit log', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(session.state).toBe('no-policy');
    expect(session.policy).toBeNull();
    expect(session.auditLog).toHaveLength(0);
    expect(session.history).toHaveLength(0);
  });
});

describe('tutorial 48 — install policy', () => {
  it('captures the policy and moves to policy-installed', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    const step = installPolicy(session, {
      name: 'tenant_isolation',
      tenantColumn: 'tenant_id',
    });

    expect(step.neutralEvent).toBe('rls.policy-installed');
    expect(step.backendEvent).toBe('view.filtered_installed');
    expect(step.state).toBe('policy-installed');
    expect(session.policy).toEqual({
      name: 'tenant_isolation',
      table: 'orders',
      tenantColumn: 'tenant_id',
    });
  });

  it('rejects an empty policy name', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(() =>
      installPolicy(session, { name: '', tenantColumn: 'tenant_id' }),
    ).toThrow(/policy name required/);
  });
});

describe('tutorial 48 — filter tenant', () => {
  it('records a per-tenant filter application', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, {
      name: 'tenant_isolation',
      tenantColumn: 'tenant_id',
    });

    const step = filterTenant(session, {
      tenantId: 'tenant-a',
      operation: 'read',
    });

    expect(step.neutralEvent).toBe('rls.tenant-isolated');
    expect(step.backendEvent).toBe('view.tenant_filter');
    expect(step.state).toBe('policy-installed');
    expect(step.metadata.tenantId).toBe('tenant-a');
    expect(step.metadata.operation).toBe('read');
    expect(step.metadata.policyName).toBe('tenant_isolation');
  });

  it('throws when called before policy install', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(() =>
      filterTenant(session, { tenantId: 'tenant-a', operation: 'read' }),
    ).toThrow(/policy-installed/);
  });
});

describe('tutorial 48 — bypass', () => {
  it('records the bypass with role + reason and moves to bypassed', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, {
      name: 'tenant_isolation',
      tenantColumn: 'tenant_id',
    });

    const step = bypassRls(session, {
      roleId: 'audit_report_writer',
      reason: 'nightly cross-tenant analytics job',
    });

    expect(step.neutralEvent).toBe('rls.bypass-used');
    expect(step.backendEvent).toBe('grant.super_bypass');
    expect(step.state).toBe('bypassed');
    expect(step.metadata.roleId).toBe('audit_report_writer');
  });

  it('sticks so filterTenant throws until policy re-installed', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, {
      name: 'tenant_isolation',
      tenantColumn: 'tenant_id',
    });
    bypassRls(session, { roleId: 'admin', reason: 'ops' });

    expect(() =>
      filterTenant(session, { tenantId: 'tenant-a', operation: 'read' }),
    ).toThrow(/policy-installed/);
  });

  it('requires an installed policy — bypass without policy is a bug', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });

    expect(() =>
      bypassRls(session, { roleId: 'admin', reason: 'ops' }),
    ).toThrow(/installed policy/);
  });
});

describe('tutorial 48 — audit log', () => {
  it('accumulates entries without changing state', () => {
    const session = createRlsSession({
      tableId: 'orders',
      provider: 'prisma',
      backend: 'mysql',
    });
    installPolicy(session, {
      name: 'tenant_isolation',
      tenantColumn: 'tenant_id',
    });

    logAudit(session, {
      tenantId: 'tenant-a',
      operation: 'read',
      allowed: true,
      reason: 'own-tenant',
    });
    logAudit(session, {
      tenantId: 'tenant-b',
      operation: 'write',
      allowed: false,
      reason: 'cross-tenant refused',
    });

    expect(session.auditLog).toHaveLength(2);
    expect(session.auditLog[0]?.allowed).toBe(true);
    expect(session.auditLog[1]?.allowed).toBe(false);
    expect(session.auditLog[1]?.reason).toBe('cross-tenant refused');
    expect(session.state).toBe('policy-installed');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 49 — pgvector + hybrid search
// ---------------------------------------------------------------------------

describe('tutorial 49 — session ctor', () => {
  it('starts unindexed with the requested distance kind', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(session.state).toBe('unindexed');
    expect(session.index).toBeNull();
    expect(session.searchCount).toBe(0);
    expect(session.distanceKind).toBe('cosine');
    expect(session.history).toHaveLength(0);
  });
});

describe('tutorial 49 — build IVFFlat index', () => {
  it('moves unindexed -> indexed with dimensions + lists', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    const step = buildIndex(session, {
      name: 'docs_ivfflat',
      kind: 'ivfflat',
      dimensions: 384,
      lists: 100,
    });

    expect(step.neutralEvent).toBe('vector.indexed');
    expect(step.backendEvent).toBe('pgvector.ivfflat_indexed');
    expect(step.state).toBe('indexed');
    expect(session.index?.dimensions).toBe(384);
    expect(session.index?.lists).toBe(100);
  });

  it('throws when ivfflat is missing lists', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(() =>
      buildIndex(session, {
        name: 'docs_ivfflat',
        kind: 'ivfflat',
        dimensions: 384,
      }),
    ).toThrow(/ivfflat requires positive `lists`/);
  });
});

describe('tutorial 49 — build HNSW index', () => {
  it('moves unindexed -> indexed with m + efConstruction', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'l2',
    });

    const step = buildIndex(session, {
      name: 'docs_hnsw',
      kind: 'hnsw',
      dimensions: 768,
      m: 16,
      efConstruction: 64,
    });

    expect(step.state).toBe('indexed');
    expect(session.index?.kind).toBe('hnsw');
    expect(session.index?.m).toBe(16);
    expect(session.index?.efConstruction).toBe(64);
  });

  it('throws when hnsw is missing efConstruction', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'l2',
    });

    expect(() =>
      buildIndex(session, {
        name: 'docs_hnsw',
        kind: 'hnsw',
        dimensions: 768,
        m: 16,
      }),
    ).toThrow(/hnsw requires positive `efConstruction`/);
  });
});

describe('tutorial 49 — knn search', () => {
  it('bumps searchCount and moves to searched', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_ivfflat',
      kind: 'ivfflat',
      dimensions: 3,
      lists: 10,
    });

    const step = knnSearch(session, { query: [0.1, 0.2, 0.3], k: 5 });

    expect(step.neutralEvent).toBe('vector.knn-searched');
    expect(step.backendEvent).toBe('pgvector.knn');
    expect(step.state).toBe('searched');
    expect(session.searchCount).toBe(1);
    expect(step.metadata.k).toBe(5);
    expect(step.metadata.dimensions).toBe(3);
  });

  it('throws on a mismatched query dimension', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_ivfflat',
      kind: 'ivfflat',
      dimensions: 3,
      lists: 10,
    });

    expect(() => knnSearch(session, { query: [0.1, 0.2], k: 5 })).toThrow(
      /query dim 2 != index dim 3/,
    );
  });

  it('throws when no index is built', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(() => knnSearch(session, { query: [0.1, 0.2, 0.3], k: 5 })).toThrow(
      /no index built/,
    );
  });
});

describe('tutorial 49 — hybrid search', () => {
  it('records k + keyword + weight and moves to searched', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_hnsw',
      kind: 'hnsw',
      dimensions: 3,
      m: 16,
      efConstruction: 64,
    });

    const step = hybridSearch(session, {
      query: [0.1, 0.2, 0.3],
      k: 10,
      keyword: 'kiwa vector search',
      vectorWeight: 0.7,
    });

    expect(step.neutralEvent).toBe('vector.hybrid-searched');
    expect(step.backendEvent).toBe('pgvector.hybrid');
    expect(step.state).toBe('searched');
    expect(step.metadata.keyword).toBe('kiwa vector search');
    expect(step.metadata.vectorWeight).toBe(0.7);
  });

  it('throws on a vector weight outside [0, 1]', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, {
      name: 'docs_hnsw',
      kind: 'hnsw',
      dimensions: 3,
      m: 16,
      efConstruction: 64,
    });

    expect(() =>
      hybridSearch(session, {
        query: [0.1, 0.2, 0.3],
        k: 5,
        keyword: 'foo',
        vectorWeight: 1.5,
      }),
    ).toThrow(/vectorWeight must be in \[0, 1\]/);
  });
});

describe('tutorial 49 — compute distance', () => {
  it('returns 0 for identical cosine vectors', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    const step = computeDistance(session, {
      a: [1, 0, 0],
      b: [1, 0, 0],
    });

    expect(step.neutralEvent).toBe('vector.distance-computed');
    expect(step.metadata.distance).toBeCloseTo(0);
    expect(step.metadata.distanceKind).toBe('cosine');
  });

  it('returns the Euclidean distance for l2 kind', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'l2',
    });

    const step = computeDistance(session, {
      a: [0, 0, 0],
      b: [3, 4, 0],
    });

    expect(step.metadata.distance).toBeCloseTo(5);
    expect(step.metadata.distanceKind).toBe('l2');
  });

  it('rejects vector length mismatch', () => {
    const session = createVectorStoreSession({
      storeId: 'docs',
      provider: 'kysely',
      backend: 'postgres',
      distanceKind: 'cosine',
    });

    expect(() =>
      computeDistance(session, { a: [1, 0], b: [1, 0, 0] }),
    ).toThrow(/vector length mismatch/);
  });
});
