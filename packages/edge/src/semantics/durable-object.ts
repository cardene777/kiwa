import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * Durable Object — stateful, single-instance actor pinned to one edge
 * location. Cloudflare Durable Objects are the canonical example; Vercel's
 * closest analogue is a session-affine edge function, Deno Deploy exposes
 * stateful objects backed by Deno KV. The mock reproduces the user-observable
 * lifecycle: an instance is created once, receives fetch requests (which pin
 * it "active"), can wake on a scheduled alarm, and persists to transactional
 * storage. Hibernation / eviction is intentionally out of scope for v0.2 — the
 * axis only exposes the 4 neutral events the fidelity grid tracks.
 *
 * State transitions:
 *   created            → 'initialized'
 *   requestDurableObject → 'active'   (from initialized or active)
 *   fireAlarm          → 'active'     (an alarm wakes the object)
 *   writeStorage       → 'active'     (a storage write implies an active handler)
 */
export type DoState = 'initialized' | 'active' | 'hibernated' | 'terminated';

export interface DurableObjectSession {
  id: string;
  platform: EdgePlatform;
  state: DoState;
  requestCount: number;
  storageKeys: Map<string, string>;
  scheduledAlarmAt: number | null;
  history: AxisStep<DoState>[];
}

/** Push a fully-formed step onto the session history and return it. */
function record(session: DurableObjectSession, step: AxisStep<DoState>): AxisStep<DoState> {
  session.history.push(step);
  return step;
}

/**
 * Create a durable object instance. State starts at 'initialized' and no
 * request has been served yet. Emits `durable-object.created`.
 */
export function createDurableObject(input: {
  id: string;
  platform: EdgePlatform;
}): DurableObjectSession {
  const session: DurableObjectSession = {
    id: input.id,
    platform: input.platform,
    state: 'initialized',
    requestCount: 0,
    storageKeys: new Map(),
    scheduledAlarmAt: null,
    history: [],
  };
  record(session, {
    neutralEvent: 'durable-object.created',
    platformEvent: platformEventName(input.platform, 'durable-object.created'),
    state: 'initialized',
    platform: input.platform,
    metadata: { id: input.id },
  });
  return session;
}

/**
 * Route a fetch request to the object. Pins the instance 'active' and bumps
 * the request counter. Emits `durable-object.requested`.
 */
export function requestDurableObject(
  session: DurableObjectSession,
  input: { url: string },
): AxisStep<DoState> {
  if (session.state === 'terminated') {
    throw new Error('requestDurableObject: object is terminated');
  }
  session.state = 'active';
  session.requestCount += 1;
  return record(session, {
    neutralEvent: 'durable-object.requested',
    platformEvent: platformEventName(session.platform, 'durable-object.requested'),
    state: session.state,
    platform: session.platform,
    metadata: { url: input.url, requestCount: session.requestCount },
  });
}

/**
 * Fire the scheduled alarm. Wakes the object into 'active' regardless of the
 * prior state and clears the pending alarm. Emits `durable-object.alarm-fired`.
 */
export function fireAlarm(session: DurableObjectSession): AxisStep<DoState> {
  if (session.state === 'terminated') {
    throw new Error('fireAlarm: object is terminated');
  }
  const firedAt = session.scheduledAlarmAt;
  session.scheduledAlarmAt = null;
  session.state = 'active';
  return record(session, {
    neutralEvent: 'durable-object.alarm-fired',
    platformEvent: platformEventName(session.platform, 'durable-object.alarm-fired'),
    state: session.state,
    platform: session.platform,
    metadata: { firedAt: firedAt ?? 0, scheduled: firedAt !== null },
  });
}

/**
 * Write a key to transactional storage. Implies an active handler, so the
 * object stays 'active'. Emits `durable-object.storage-written`.
 */
export function writeStorage(
  session: DurableObjectSession,
  input: { key: string; value: string },
): AxisStep<DoState> {
  if (session.state === 'terminated') {
    throw new Error('writeStorage: object is terminated');
  }
  session.storageKeys.set(input.key, input.value);
  session.state = 'active';
  return record(session, {
    neutralEvent: 'durable-object.storage-written',
    platformEvent: platformEventName(session.platform, 'durable-object.storage-written'),
    state: session.state,
    platform: session.platform,
    metadata: { key: input.key, size: input.value.length, keyCount: session.storageKeys.size },
  });
}
