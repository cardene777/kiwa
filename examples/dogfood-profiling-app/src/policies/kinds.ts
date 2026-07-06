/**
 * The 4 canonical profile kinds the dogfood app targets.
 *
 * The quartet covers the entire continuous-profiling axis set —
 *  - cpu ... on-CPU sampling (default pyroscope 100Hz sampler)
 *  - off-cpu ... off-CPU sampling (eBPF wakeup / sleep tracker, catches
 *    blocked / waiting stacks the CPU sampler misses)
 *  - memory ... alloc profile (heap growth per stack, jemalloc / tcmalloc
 *    tracker)
 *  - lock ... mutex / contention profile (blocking stack traces on
 *    contended mutexes)
 *
 * Every kind is exercised through the full 16-op lifecycle so the
 * fidelity harness surfaces per-kind behavioural drift.
 */

import type { ProfileKind } from '../adapters/interface.js';

export const KIND_CPU: ProfileKind = 'cpu';
export const KIND_OFF_CPU: ProfileKind = 'off-cpu';
export const KIND_MEMORY: ProfileKind = 'memory';
export const KIND_LOCK: ProfileKind = 'lock';

/** All 4 profile kinds — used by the fidelity harness to walk every kind. */
export const ALL_KINDS: readonly ProfileKind[] = [
  KIND_CPU,
  KIND_OFF_CPU,
  KIND_MEMORY,
  KIND_LOCK,
];
