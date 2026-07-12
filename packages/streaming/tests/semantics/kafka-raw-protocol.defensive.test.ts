import { describe, expect, it } from 'vitest';
import { createKafkaRawProtocol } from '../../src/index.js';

// Follow-up file — closes the reachable branches in kafka-raw-protocol.js
// that kafka-raw-protocol.branches.test.ts leaves open. In particular, the
// `?? new Set()` fallback in advanceHighWatermark fires when a topic-partition
// has never had an ISR set (line 119 in the compiled JS).
//
// Complements kafka-raw-protocol.branches.test.ts (T-KRP-B-001..006).

describe('createKafkaRawProtocol defensive guards', () => {
  it('T-KRP-B-007 advanceHighWatermark on a partition without ISR keeps HW at current', () => {
    const protocol = createKafkaRawProtocol({ replicationFactor: 3, minInSyncReplicas: 2 });
    // No addToIsr call for this partition → `isr.get(key)` returns undefined
    // → `?? new Set()` fallback → size < minInSyncReplicas → HW stays 0.
    const result = protocol.advanceHighWatermark('never-populated', 0, 42);
    expect(result).toBe(0);
    expect(protocol.getHighWatermark('never-populated', 0)).toBe(0);
  });
});
