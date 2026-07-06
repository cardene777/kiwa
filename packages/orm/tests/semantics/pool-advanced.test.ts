import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createPoolAdvancedSession,
  drainPoolGracefully,
  exportPoolMetrics,
  runPoolHealthCheck,
  warmPoolConnections,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('pool-advanced axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: health → warm → drain → metrics happy path',
    (provider, backend) => {
      const session = createPoolAdvancedSession({
        poolId: 'pool-1',
        provider,
        backend,
        minWarmConnections: 2,
      });
      runPoolHealthCheck(session, { latencyMs: 3, ok: true });
      warmPoolConnections(session, { connectionCount: 3 });
      drainPoolGracefully(session, { deadlineMs: 1000 });
      const metrics = exportPoolMetrics(session, { active: 0, idle: 3, waiting: 0 });
      expect(metrics.neutralEvent).toBe('pool-advanced.metrics-exported');
      expect(metrics.metadata.idle).toBe(3);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for health check',
    (provider, backend) => {
      const session = createPoolAdvancedSession({
        poolId: 'pool-1',
        provider,
        backend,
        minWarmConnections: 1,
      });
      const step = runPoolHealthCheck(session, { latencyMs: 1, ok: true });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'pool-advanced.health-checked', provider),
      );
    },
  );

  it('runPoolHealthCheck rejects failed health check', () => {
    const session = createPoolAdvancedSession({
      poolId: 'pool-1',
      provider: 'drizzle',
      backend: 'postgres',
      minWarmConnections: 1,
    });
    expect(() => runPoolHealthCheck(session, { latencyMs: 1, ok: false })).toThrow(/failed/);
  });

  it('warmPoolConnections requires health check first', () => {
    const session = createPoolAdvancedSession({
      poolId: 'pool-1',
      provider: 'drizzle',
      backend: 'postgres',
      minWarmConnections: 1,
    });
    expect(() => warmPoolConnections(session, { connectionCount: 1 })).toThrow(/healthy/);
  });

  it('warmPoolConnections rejects below minimum warm count', () => {
    const session = createPoolAdvancedSession({
      poolId: 'pool-1',
      provider: 'drizzle',
      backend: 'postgres',
      minWarmConnections: 2,
    });
    runPoolHealthCheck(session, { latencyMs: 1, ok: true });
    expect(() => warmPoolConnections(session, { connectionCount: 1 })).toThrow(/below/);
  });

  it('exportPoolMetrics rejects negative values', () => {
    const session = createPoolAdvancedSession({
      poolId: 'pool-1',
      provider: 'drizzle',
      backend: 'postgres',
      minWarmConnections: 1,
    });
    runPoolHealthCheck(session, { latencyMs: 1, ok: true });
    warmPoolConnections(session, { connectionCount: 1 });
    drainPoolGracefully(session, { deadlineMs: 1000 });
    expect(() => exportPoolMetrics(session, { active: -1, idle: 0, waiting: 0 })).toThrow(
      /non-negative/,
    );
  });
});
