import { describe, expect, it } from 'vitest';
import {
  advanceBinlogPosition,
  backendEventName,
  createBinlogSession,
  detectGtidGap,
  negotiateBinlogFormat,
  updateGtidSet,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('binlog axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: position → gtid → format → gap happy path',
    (provider, backend) => {
      const session = createBinlogSession({ serverId: 'server-1', provider, backend });
      advanceBinlogPosition(session, { file: 'binlog.000001', position: 100 });
      updateGtidSet(session, { gtid: 'uuid:1' });
      negotiateBinlogFormat(session, { format: 'ROW' });
      const gap = detectGtidGap(session, { expectedGtid: 'uuid:2' });
      expect(gap.neutralEvent).toBe('binlog.gap-detected');
      expect(gap.metadata.observedGtidCount).toBe(1);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for position advance',
    (provider, backend) => {
      const session = createBinlogSession({ serverId: 'server-1', provider, backend });
      const step = advanceBinlogPosition(session, { file: 'binlog.000001', position: 100 });
      expect(step.backendEvent).toBe(backendEventName(backend, 'binlog.position-advanced', provider));
    },
  );

  it('advanceBinlogPosition rejects regression within same file', () => {
    const session = createBinlogSession({ serverId: 's1', provider: 'drizzle', backend: 'mysql' });
    advanceBinlogPosition(session, { file: 'binlog.000001', position: 100 });
    expect(() => advanceBinlogPosition(session, { file: 'binlog.000001', position: 99 })).toThrow(
      /advance/,
    );
  });

  it('updateGtidSet requires positioned state', () => {
    const session = createBinlogSession({ serverId: 's1', provider: 'drizzle', backend: 'mysql' });
    expect(() => updateGtidSet(session, { gtid: 'uuid:1' })).toThrow(/positioned/);
  });

  it('updateGtidSet rejects duplicate GTID', () => {
    const session = createBinlogSession({ serverId: 's1', provider: 'drizzle', backend: 'mysql' });
    advanceBinlogPosition(session, { file: 'binlog.000001', position: 100 });
    updateGtidSet(session, { gtid: 'uuid:1' });
    expect(() => updateGtidSet(session, { gtid: 'uuid:1' })).toThrow(/duplicate/);
  });

  it('detectGtidGap rejects present GTID', () => {
    const session = createBinlogSession({ serverId: 's1', provider: 'drizzle', backend: 'mysql' });
    advanceBinlogPosition(session, { file: 'binlog.000001', position: 100 });
    updateGtidSet(session, { gtid: 'uuid:1' });
    negotiateBinlogFormat(session, { format: 'ROW' });
    expect(() => detectGtidGap(session, { expectedGtid: 'uuid:1' })).toThrow(/already present/);
  });
});
