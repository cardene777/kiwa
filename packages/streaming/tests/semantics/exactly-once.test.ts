import { describe, expect, it } from 'vitest';
import {
  createExactlyOnceSemantics,
  isExactlyOnceSemantics,
} from '../../src/index.js';
import type { StreamingMessage } from '../../src/index.js';

describe('createExactlyOnceSemantics (cross-provider)', () => {
  const providers = ['kafka', 'redpanda', 'nats'] as const;

  for (const provider of providers) {
    it(`T-EOS-CP-${provider}-001 begin/send/commit emits records tagged with the batch id`, () => {
      const eos = createExactlyOnceSemantics({ provider, transactionalId: 'tx-1' });
      expect(isExactlyOnceSemantics(eos)).toBe(true);
      eos.begin();
      eos.send({ topic: 't', value: 'a', key: null });
      eos.send({ topic: 't', value: 'b', key: null });
      const emitted = eos.commit();
      expect(emitted.map((m) => m.value)).toEqual(['a', 'b']);
      expect(emitted.every((m) => m.headers['x-kiwa-txn-id'] === 'tx-1::1')).toBe(true);
      expect(eos.state()).toBe('committed');
    });

    it(`T-EOS-CP-${provider}-002 abort discards pending and filter hides aborted records`, () => {
      const eos = createExactlyOnceSemantics({ provider, transactionalId: 'tx-1' });
      eos.begin();
      eos.send({ topic: 't', value: 'ghost', key: null });
      // Snapshot what would have been the batch id — before abort it's tx-1::1.
      eos.abort();
      const ghost: StreamingMessage<string> = {
        topic: 't',
        partition: 0,
        offset: 0,
        timestamp: 0,
        key: null,
        value: 'ghost',
        headers: { 'x-kiwa-txn-id': 'tx-1::1' },
      };
      const kept: StreamingMessage<string> = {
        topic: 't',
        partition: 0,
        offset: 1,
        timestamp: 0,
        key: null,
        value: 'kept',
        headers: {},
      };
      expect(eos.filter([ghost, kept])).toEqual([kept]);
    });

    it(`T-EOS-CP-${provider}-003 read-uncommitted keeps aborted records`, () => {
      const eos = createExactlyOnceSemantics({
        provider,
        transactionalId: 'tx-2',
        isolationLevel: 'read-uncommitted',
      });
      eos.begin();
      eos.send({ topic: 't', value: 'ghost', key: null });
      eos.abort();
      const ghost: StreamingMessage<string> = {
        topic: 't',
        partition: 0,
        offset: 0,
        timestamp: 0,
        key: null,
        value: 'ghost',
        headers: { 'x-kiwa-txn-id': 'tx-2::1' },
      };
      expect(eos.filter([ghost])).toEqual([ghost]);
    });
  }

  it('T-EOS-CP-004 begin without commit/abort rejects a second begin', () => {
    const eos = createExactlyOnceSemantics({ provider: 'kafka', transactionalId: 'tx-3' });
    eos.begin();
    expect(() => eos.begin()).toThrow(/begin without commit/);
  });

  it('T-EOS-CP-005 send outside a txn rejects', () => {
    const eos = createExactlyOnceSemantics({ provider: 'kafka', transactionalId: 'tx-4' });
    expect(() => eos.send({ topic: 't', value: 'x', key: null })).toThrow(/without active transaction/);
  });

  it('T-EOS-CP-006 commit without a txn rejects', () => {
    const eos = createExactlyOnceSemantics({ provider: 'kafka', transactionalId: 'tx-5' });
    expect(() => eos.commit()).toThrow(/without active transaction/);
  });
});
