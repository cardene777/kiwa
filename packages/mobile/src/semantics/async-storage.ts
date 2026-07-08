import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.51 async-storage axis — AsyncStorage / MMKV / web localStorage。
 */
export type AsyncStorageState = 'idle' | 'set' | 'read' | 'removed' | 'batch-flushed';

export interface AsyncStorageSession {
  target: MobileTarget;
  storeId: string;
  state: AsyncStorageState;
  items: Map<string, string>;
  operations: number;
  history: AxisStep<AsyncStorageState>[];
}

function emit(
  session: AsyncStorageSession,
  neutralEvent:
    | 'async-storage.item_set'
    | 'async-storage.item_read'
    | 'async-storage.item_removed'
    | 'async-storage.batch_flushed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<AsyncStorageState> {
  const step: AxisStep<AsyncStorageState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { storeId: session.storeId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initAsyncStorage(input: { target: MobileTarget; storeId: string }): AsyncStorageSession {
  if (input.storeId.length === 0) throw new Error('initAsyncStorage: storeId must not be empty');
  return {
    target: input.target,
    storeId: input.storeId,
    state: 'idle',
    items: new Map(),
    operations: 0,
    history: [],
  };
}

export function setAsyncStorageItem(
  session: AsyncStorageSession,
  input: { key: string; value: string },
): AxisStep<AsyncStorageState> {
  if (input.key.length === 0) throw new Error('setAsyncStorageItem: key must not be empty');
  session.items.set(input.key, input.value);
  session.operations += 1;
  session.state = 'set';
  return emit(session, 'async-storage.item_set', { key: input.key, size: input.value.length });
}

export function readAsyncStorageItem(
  session: AsyncStorageSession,
  key: string,
): AxisStep<AsyncStorageState> {
  const value = session.items.get(key);
  session.operations += 1;
  session.state = 'read';
  return emit(session, 'async-storage.item_read', { key, hit: value !== undefined });
}

export function removeAsyncStorageItem(
  session: AsyncStorageSession,
  key: string,
): AxisStep<AsyncStorageState> {
  const removed = session.items.delete(key);
  session.operations += 1;
  session.state = 'removed';
  return emit(session, 'async-storage.item_removed', { key, removed });
}

export function flushAsyncStorageBatch(session: AsyncStorageSession): AxisStep<AsyncStorageState> {
  session.state = 'batch-flushed';
  return emit(session, 'async-storage.batch_flushed', {
    itemCount: session.items.size,
    totalOperations: session.operations,
  });
}
