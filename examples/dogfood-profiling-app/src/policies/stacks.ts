/**
 * Canonical stack fixtures for the dogfood-profiling-app.
 *
 * Each fixture models a realistic call stack for the given profile kind
 * so the fidelity harness has stable inputs to walk both mock and real
 * adapters through. The stacks are intentionally short (3-5 frames) so
 * tests remain readable; production stacks would be 20-50 frames deep.
 */

import type { SampleInput } from '../adapters/interface.js';

/** Hot HTTP handler stack — canonical on-CPU sample. */
export const STACK_HTTP_HOT: SampleInput = {
  kind: 'cpu',
  stack: ['main', 'http.handler', 'json.encode', 'json.encode.string'],
  valueBytes: 1_000_000,
  timestampMs: 1_700_000_000_000,
};

/** DB query stack — canonical on-CPU sample. */
export const STACK_DB_QUERY: SampleInput = {
  kind: 'cpu',
  stack: ['main', 'http.handler', 'db.query', 'sql.parse'],
  valueBytes: 500_000,
  timestampMs: 1_700_000_000_100,
};

/** Off-CPU wait stack — canonical off-CPU sample. */
export const STACK_OFF_CPU_WAIT: SampleInput = {
  kind: 'off-cpu',
  stack: ['main', 'runtime.futex.wait', 'sync.mutex.lock'],
  valueBytes: 250_000,
  timestampMs: 1_700_000_000_200,
};

/** Memory alloc stack — canonical memory sample. */
export const STACK_MEMORY_ALLOC: SampleInput = {
  kind: 'memory',
  stack: ['main', 'http.handler', 'json.marshal', 'runtime.mallocgc'],
  valueBytes: 4_096,
  timestampMs: 1_700_000_000_300,
};

/** Lock contention stack — canonical lock sample. */
export const STACK_LOCK_CONTENTION: SampleInput = {
  kind: 'lock',
  stack: ['main', 'cache.get', 'sync.mutex.lock', 'runtime.semacquire'],
  valueBytes: 750_000,
  timestampMs: 1_700_000_000_400,
};

/** All 5 canonical stacks — one per kind (cpu has 2 for baseline / regression). */
export const ALL_STACKS: readonly SampleInput[] = [
  STACK_HTTP_HOT,
  STACK_DB_QUERY,
  STACK_OFF_CPU_WAIT,
  STACK_MEMORY_ALLOC,
  STACK_LOCK_CONTENTION,
];
