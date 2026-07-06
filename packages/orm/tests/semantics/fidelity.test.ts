import { describe, expect, it } from 'vitest';
import {
  AXIS_TO_EVENTS,
  backendEventName,
  collectFidelityCoverage,
  type OrmAxis,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('fidelity harness — 3 × 3 × 16 = 144 grid', () => {
  it('collects 144 rows for default 3 provider × 3 backend', () => {
    const coverage = collectFidelityCoverage({ providers, backends });
    expect(coverage.providers).toEqual(providers);
    expect(coverage.backends).toEqual(backends);
    expect(coverage.axes.length).toBe(16);
    expect(coverage.rows.length).toBe(3 * 3 * 16);
  });

  it('every axis has exactly 4 neutral events', () => {
    for (const axis of Object.keys(AXIS_TO_EVENTS) as OrmAxis[]) {
      expect(AXIS_TO_EVENTS[axis].length).toBe(4);
    }
  });

  it('each row backendEvents translated via backendEventName', () => {
    const coverage = collectFidelityCoverage({ providers, backends });
    for (const row of coverage.rows) {
      row.neutralEvents.forEach((n, i) => {
        expect(row.backendEvents[i]).toBe(
          backendEventName(row.backend, n, row.provider),
        );
      });
    }
  });

  it('subset selection collects only requested rows', () => {
    const coverage = collectFidelityCoverage({
      providers: ['drizzle'],
      backends: ['postgres', 'mysql'],
    });
    expect(coverage.rows.length).toBe(1 * 2 * 16);
    expect(coverage.rows.every((r) => r.provider === 'drizzle')).toBe(true);
  });

  it('all 16 axes appear in the rows', () => {
    const coverage = collectFidelityCoverage({ providers, backends });
    const seen = new Set(coverage.rows.map((r) => r.axis));
    expect(seen.size).toBe(16);
    expect(seen).toEqual(new Set(Object.keys(AXIS_TO_EVENTS) as OrmAxis[]));
  });

  it('SQLite falls back to neutral for server-only axes', () => {
    // SQLite has no dialect entry for e.g. replication.primary-write; it
    // should fall back to the neutral name.
    expect(backendEventName('sqlite', 'replication.primary-write')).toBe(
      'replication.primary-write',
    );
    // Postgres has a real dialect string.
    expect(backendEventName('postgres', 'replication.primary-write')).toBe(
      'wal_sender.progress',
    );
  });

  it('Prisma provider overlay applies only on marked events', () => {
    // pool.acquired has a prisma-specific overlay
    expect(backendEventName('postgres', 'pool.acquired', 'prisma')).toBe(
      'prisma.pool.acquired',
    );
    // pool.idle-timeout has no overlay → backend dialect wins
    expect(backendEventName('postgres', 'pool.idle-timeout', 'prisma')).toBe(
      'pgbouncer.idle_close',
    );
    // drizzle / kysely never overlay → backend dialect wins
    expect(backendEventName('postgres', 'pool.acquired', 'drizzle')).toBe(
      'pgbouncer.client_acquired',
    );
    expect(backendEventName('postgres', 'pool.acquired', 'kysely')).toBe(
      'pgbouncer.client_acquired',
    );
  });
});
