import { describe, expect, it } from 'vitest';
import {
  appendOutbox,
  backendEventName,
  confirmDelivery,
  createCdcSession,
  decodeEvent,
  markEventOrdered,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('cdc axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: decode → outbox → order → deliver happy path',
    (provider, backend) => {
      const session = createCdcSession({ slotName: 'slot_1', provider, backend });
      decodeEvent(session, {
        event: { lsn: 10, kind: 'insert', table: 'users', payload: { id: 1 } },
      });
      appendOutbox(session, {});
      decodeEvent(session, {
        event: { lsn: 20, kind: 'update', table: 'users', payload: { id: 1, name: 'x' } },
      });
      appendOutbox(session, {});
      const ordered = markEventOrdered(session);
      expect(ordered.neutralEvent).toBe('cdc.event-ordered');
      expect(ordered.metadata.highWaterLsn).toBe(20);
      const delivered = confirmDelivery(session, { upToLsn: 20 });
      expect(session.confirmedLsn).toBe(20);
      expect(delivered.state).toBe('delivered');
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for each event',
    (provider, backend) => {
      const session = createCdcSession({ slotName: 's', provider, backend });
      const step = decodeEvent(session, {
        event: { lsn: 1, kind: 'insert', table: 't', payload: {} },
      });
      expect(step.backendEvent).toBe(backendEventName(backend, 'cdc.decoded', provider));
    },
  );

  it('decodeEvent rejects lsn <= 0', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    expect(() =>
      decodeEvent(session, { event: { lsn: 0, kind: 'insert', table: 't', payload: {} } }),
    ).toThrow(/positive/);
  });

  it('appendOutbox with empty decoded buffer throws', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    // idle session with empty decoded buffer — the state-precondition guard
    // fires first, rejecting the idle state before the empty-buffer check.
    expect(() => appendOutbox(session, {})).toThrow(/decoding|empty/);
  });

  it('markEventOrdered rejects out-of-order lsn', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 20, kind: 'insert', table: 't', payload: {} } });
    appendOutbox(session, {});
    decodeEvent(session, { event: { lsn: 10, kind: 'update', table: 't', payload: {} } });
    appendOutbox(session, {});
    expect(() => markEventOrdered(session)).toThrow(/out of order/);
  });

  it('markEventOrdered rejects empty outbox', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    expect(() => markEventOrdered(session)).toThrow(/empty/);
  });

  it('confirmDelivery requires ordered state', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    appendOutbox(session, {});
    expect(() => confirmDelivery(session, { upToLsn: 10 })).toThrow(/ordered/);
  });

  it('confirmDelivery rejects regressing lsn', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);
    confirmDelivery(session, { upToLsn: 10 });
    expect(() => confirmDelivery(session, { upToLsn: 5 })).toThrow(/regresses/);
  });

  it('confirmDelivery allows advancing after already delivered', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);
    confirmDelivery(session, { upToLsn: 10 });
    decodeEvent(session, { event: { lsn: 20, kind: 'update', table: 't', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);
    const second = confirmDelivery(session, { upToLsn: 20 });
    expect(second.metadata.confirmedLsn).toBe(20);
  });

  it('regression [finding 2] appendOutbox rejected from idle state with explicit event', () => {
    // adversarial review found: appendOutbox ignored the JSDoc precondition
    // (`decoding` / `ordered`) — passing an explicit event from `idle` silently
    // promoted the session to `buffered` without a preceding decode.
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    expect(session.state).toBe('idle');
    expect(() =>
      appendOutbox(session, {
        event: { lsn: 1, kind: 'insert', table: 't', payload: {} },
      }),
    ).toThrow(/requires decoding/);
    // idle state preserved, no event was appended
    expect(session.state).toBe('idle');
    expect(session.outbox.length).toBe(0);
  });

  it('regression [finding 3] confirmDelivery rejects upToLsn beyond outbox high-water', () => {
    // adversarial review found: confirmDelivery permitted `upToLsn` values that
    // exceeded the outbox high-water mark, acknowledging events that were
    // never appended and silently corrupting the delivery invariant.
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);
    // outbox contains lsn=10, so high-water=10; upToLsn=999 must reject.
    expect(() => confirmDelivery(session, { upToLsn: 999 })).toThrow(/exceeds outbox high-water/);
    expect(session.confirmedLsn).toBe(0);
  });

  it('appendOutbox with explicit event overrides last decoded', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    const step = appendOutbox(session, {
      event: { lsn: 99, kind: 'delete', table: 't', payload: {} },
    });
    expect(step.metadata.lsn).toBe(99);
    expect(session.outbox[0]?.lsn).toBe(99);
  });

  it('appendOutbox rejects when decoded buffer is empty (no event to append)', () => {
    // Force session.state = 'decoding' but leave session.decoded empty.
    // decodeEvent auto-populates decoded, so we drop it after decoding.
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    session.decoded.length = 0; // drop the buffered event
    expect(() => appendOutbox(session, {})).toThrow(/no event to append/);
  });

  it('confirmDelivery rejects a regressing upToLsn (below confirmedLsn)', () => {
    const session = createCdcSession({ slotName: 's', provider: 'drizzle', backend: 'postgres' });
    decodeEvent(session, { event: { lsn: 10, kind: 'insert', table: 't', payload: {} } });
    appendOutbox(session, {});
    markEventOrdered(session);
    confirmDelivery(session, { upToLsn: 10 });
    // now confirmedLsn=10; a subsequent upToLsn<10 must regress
    expect(() => confirmDelivery(session, { upToLsn: 5 })).toThrow(/regresses confirmedLsn/);
  });
});
