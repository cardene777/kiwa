# Streaming testing — producer / consumer / exactly-once / DLQ / schema-registry (SSOT)

kiwa's v1.13 realtime work (Supabase Realtime + Ably + Socket.io) covered the **time-axis** mock case — order, timing, drop, reconnect, backpressure — for synchronous over-the-wire signals. v1.20 adds **five axes on top of that base** — the ones production teams hit once their WebSocket + SSE suite is green but the event-driven backbone (Kafka / Redpanda / NATS) introduces semantics the realtime mocks do not capture. This concept doc is the SSOT for those five axes; the tutorials and dogfood apps are the concrete implementations.

## Axis 1 — Producer semantics (partition + serialization + batch)

Kafka, Redpanda, and NATS JetStream all route messages through a partition (Kafka / Redpanda) or a subject (NATS). A producer picks the partition either by hashing a key or by passing an explicit partition number; a subject picks the consumer by matching the routing pattern.

That divergence matters for tests because producer bugs look like:

- "The keyed producer wrote to a different partition than the consumer expected" — the hash function changed, or the partition count was off
- "The producer sent an unserialized value" — the `serializer` config was missing, or the schema evolved without a version bump
- "The batch send did not flatten correctly" — `sendBatch` merged records across topics into one write instead of one per topic

kiwa surfaces the pattern in three places.

- `createKafkaMock({ defaultPartitionCount })` — creates a broker that hashes keys to partitions using a deterministic djb2-style hash. Two writes with the same key always land on the same partition. `result[0].partition` surfaces the choice.
- `producer.send({ topic, messages: [{ key, value, partition? }] })` — writes to the hashed partition unless `partition` is set explicitly. Out-of-range partition throws. `sendBatch(records[])` flattens results across multiple topic writes.
- `nats.publish(subject, value)` (core) or `js.publish(subject, value)` (JetStream) — routes on subject match. Wildcards `*` (single token) + `>` (trailing multi-token) determine which subscriber receives the message. `compileSubject(pattern)` throws if `>` is not the last token.

The **contract** each helper enforces is symmetric — every producer write records `{ topic, partition, offset }` (Kafka) or `{ subject, sequence }` (NATS JetStream), and every read surfaces the same shape. That means a test can assert on the exact routing choice without a real broker.

### Why partition ordering matters more than global ordering

The classic microservice pattern "publish an event and hope the consumer sees them in order" costs 2 layers of Redis or Postgres to enforce. Kafka's per-partition ordering is stronger — messages within a partition are strictly ordered, but no cross-partition ordering guarantee applies. Get the partitioner wrong (e.g., hash on the wrong key), and events for the same user land on different partitions, breaking the ordering contract silently.

`producer.send` returns the `partition` field, so a test asserting on user-1 events lands on partition N + user-2 events lands on partition M validates the partitioner. `kafka.getTopicMessages(topic)` returns the flat log (partition 0 first, then partition 1, etc.), so a per-partition ordering assertion is `filter().map(m => m.value)` on the returned array.

## Axis 2 — Consumer semantics (group + offset + rebalance)

A consumer group is Kafka's coordination primitive — N consumers join a group, the coordinator assigns partitions to members, and offsets track "where each consumer is". Two group semantics show up in every non-trivial test — partition assignment (range vs round-robin) and offset commit (auto vs manual).

That divergence matters for tests because consumer bugs look like:

- "The second consumer joined the group but did not receive any messages" — the assigner did not rebalance, or all partitions stayed on the first consumer
- "The consumer restarted and re-read messages" — the committed offset was 0 because `autoCommit=false` was set without an explicit commit
- "The consumer skipped messages after a restart" — the seek origin diverged from the committed offset

kiwa surfaces the pattern in three places.

- `kafka.consumer({ groupId, partitionAssigner: 'range' | 'round-robin' })` — creates a group member. `consumer.assignments()` returns the current partition ownership as `Map<topic, partitions[]>`. Range gives all partitions to a single owner; round-robin distributes 4 partitions as 2 + 2 across two consumers.
- `consumer.run({ eachMessage, autoCommit })` — walks each assigned partition, calls `eachMessage(record)` for each message, and commits offsets when `autoCommit=true` (the default). `consumer.commitOffsets(offsets[])` records explicit offsets.
- `consumer.seek({ topic, partition, offset })` — overrides the read start position. `kafka.getCommittedOffset(groupId, topic, partition)` surfaces the current committed value; `undefined` means "never committed".

The **contract** each helper enforces is symmetric — every commit records `{ groupId, topic, partition, offset }`, every read starts at the greater of `seek` or `committedOffset`, and every rebalance recomputes assignments deterministically.

### Why offset semantics need dedicated assertions

The classic pattern "consume all messages and hope they don't repeat" costs a full at-least-once retry loop in the handler. Kafka's committed offset is the durable "we processed everything up to here" marker — the assertion `expect(kafka.getCommittedOffset(group, topic, partition)).toBe(N)` catches "the commit did not fire" bugs before they hit production.

`autoCommit=false` + explicit `commitOffsets` is the pattern for at-least-once with idempotent handlers. The test asserts on the exact committed value after a batch of `run()` calls to verify the commit boundary. Miss the assertion and a real deploy silently re-reads messages after every restart.

## Axis 3 — Exactly-once semantics (idempotent + transactional + read-committed)

Kafka's "exactly-once semantics" (EOS) is a three-part contract — idempotent producer (dedup on sequence), transactional producer (atomic commit across multiple partitions + topics), and read-committed consumer (skip uncommitted records). NATS JetStream provides a similar guarantee through the durable consumer + ack model.

That divergence matters for tests because EOS bugs look like:

- "A retried publish landed twice on the broker" — the producer was not idempotent, or the sequence number was reset
- "A transaction committed some messages but not all" — the transactional producer aborted mid-flight, or the isolation level was `read-uncommitted`
- "The consumer saw a message from an aborted transaction" — the read-committed filter was not applied, or the transaction marker was missed

kiwa surfaces the pattern in three places.

- `createIdempotentProducer({ kafka })` — wraps the base producer with a sequence-number dedup. `producer.send(record, sequence)` returns `[]` (dedup) when the sequence was already seen. `producer.isDuplicate(sequence)` surfaces the check.
- `createTransactionalProducer({ kafka, transactionalId })` — gates the broker view. Pre-commit, `kafka.getTopicMessages(topic)` returns `[]`. Post-commit, all records flip visible atomically. `producer.currentState()` returns `'active' | 'committed' | 'aborted'`.
- `createReadCommittedFilter()` — filters a message stream to skip records inside an active or aborted transaction. `filter.filter(messages)` returns the visible subset.

The **contract** each helper enforces is symmetric — every idempotent send dedups on `(producerId, sequence)`, every transactional commit flushes atomically, and every read-committed filter drops uncommitted or aborted records.

### Why exactly-once needs dedicated assertions

The classic pattern "retry on failure and hope the handler is idempotent" costs a full deduplication layer in the consumer. Kafka's idempotent producer moves the dedup upstream — the broker rejects duplicate sequence numbers before they enter the log.

`isDuplicate(sequence)` + `expect(kafka.getTopicMessages(topic)).toHaveLength(1)` after a duplicate send catches the dedup path. `currentState()` + `expect(kafka.getTopicMessages(topic)).toHaveLength(0)` before commit catches the pre-commit gate. Both patterns are pure — no timing dependence, no waiting for a real broker.

## Axis 4 — DLQ semantics (retry + quarantine + poison isolation)

A dead-letter queue (DLQ) is the "we can't process this, park it for a human" primitive. Every message-driven system needs one — otherwise a single poison message blocks the entire consumer group by looping forever.

That divergence matters for tests because DLQ bugs look like:

- "The consumer got stuck retrying the same message forever" — no maxAttempts cap, or the DLQ hand-off was missing
- "The DLQ received messages that should have been retried" — maxAttempts=1, or the retry policy was misconfigured
- "The DLQ callback did not fire" — `onDeadLetter` was configured incorrectly, or the quarantine array was reset

kiwa surfaces the pattern in one place.

- `createDeadLetterQueue({ topic, handler, retryPolicy, onDeadLetter })` — walks the retry loop, and on exhaustion appends the message to the quarantine array. `dlq.handle(message)` returns `'handled'` (success) / `'quarantined'` (retries exhausted). `dlq.quarantined()` returns the array of `{ original, attempts, reason, quarantinedAt }` entries.

The **contract** the DLQ enforces is symmetric — every retry increments `attempts`, every quarantine appends to the array, every `onDeadLetter` callback fires with the same shape as the quarantine entry.

### Why DLQ needs dedicated assertions

The classic pattern "log the error and continue" costs the message. A DLQ preserves the record — the assertion `expect(dlq.quarantined()).toHaveLength(1)` + `expect(entries[0]?.reason).toBe('poison')` catches "the poison message was lost" bugs before they hit production.

`retryPolicy: { maxAttempts, backoff: 'linear' | 'exponential', baseDelayMs, maxDelayMs }` shapes the retry curve. `onDeadLetter: (entry) => alertPagerDuty(entry)` chains to alerting. The test asserts on both the retry count (`entries[0]?.attempts`) and the quarantine array size, so a regression surfaces at the exact retry boundary.

## Axis 5 — Schema registry semantics (Avro / Protobuf / JSON compat modes)

Schema evolution is the "the producer changed the message shape, will the consumer still work?" primitive. Every long-lived event stream needs schema versioning — otherwise a producer deploy silently breaks every consumer.

That divergence matters for tests because schema bugs look like:

- "The consumer crashed after a producer deploy" — the schema evolved BACKWARD-incompatibly (added a required field)
- "The producer deploy was blocked but should have passed" — the compat mode was FULL when BACKWARD was intended
- "A duplicate schema registration bumped the version" — the registry did not detect the schema hash equality

kiwa surfaces the pattern in one place.

- `createSchemaRegistry({ defaultCompatibility, subjectNamingStrategy })` — Confluent-shaped registry. `registry.register({ subject, kind, schema })` writes a versioned entry. `registry.checkCompatibility({ subject, kind, schema })` returns `{ compatible, mode, reasons[] }` without writing. `registry.setCompatibility(subject, mode)` overrides per-subject.

The **contract** the registry enforces is symmetric — every registration increments the version (unless the schema hash equals an existing version), every compat check returns a machine-readable verdict + reasons, and every subject carries an independent compat mode.

### Why compat modes need dedicated assertions

The classic pattern "deploy the producer and hope the consumers survive" costs a rollback on every schema drift. Confluent's compat modes shift the check to registration time — BACKWARD (new schema reads old data), FORWARD (old schema reads new data), FULL (both).

`checkCompatibility` is synchronous (no round-trip to the broker) and returns `{ compatible, mode, reasons }`. The pattern `if (!check.compatible) throw new Error(check.reasons.join(', '))` gates every publish against schema drift — the test asserts on the gate without a real registry.

Three compatibility modes are supported.

- **BACKWARD** (default) — new schema can read old data. Safe to add optional fields with defaults, safe to remove required fields with defaults. This is the mode most Kafka-Streams / KSQL / consumer-first teams pick.
- **FORWARD** — old schema can read new data. Safe to add required fields, safe to remove optional fields. This is the mode producer-first teams pick.
- **FULL** — both BACKWARD and FORWARD. Strictest mode; every evolution passes both checks. Use it for cross-team contracts where producer + consumer upgrade in lockstep.

## Assertion patterns

The 5 axes produce five assertion patterns.

- **Producer partition assertions** — every keyed send lands on the hashed partition. The assertion is `expect(first[0]?.partition).toBe(second[0]?.partition)` for two writes with the same key. This catches "the partitioner changed under a library upgrade".
- **Consumer group rebalance assertions** — every consumer joining a group triggers a reassignment. The assertion is `expect(a1.length + a2.length).toBe(numPartitions)` for two consumers on a 4-partition topic. This catches "the second consumer never received a partition".
- **Exactly-once state assertions** — every transactional producer transitions `active → committed | aborted`. The assertion is `expect(kafka.getTopicMessages(topic)).toHaveLength(0)` before commit, `expect(producer.currentState()).toBe('committed')` after commit. This catches "the commit did not flush" or "the abort did not discard".
- **DLQ quarantine assertions** — every exhausted retry appends to the quarantine array. The assertion is `expect(dlq.quarantined()).toHaveLength(1)` + `expect(entries[0]?.attempts).toBe(maxAttempts)`. This catches "the poison message was retried forever" or "the DLQ was silently swallowed".
- **Schema compat assertions** — every evolution passes or fails the current mode. The assertion is `expect(check.compatible).toBe(true)` for a safe evolution, `expect(check.compatible).toBe(false)` + `expect(check.reasons.length).toBeGreaterThan(0)` for a rejected one. This catches "the deploy broke the compat guarantee".

All five patterns are pure — they add no runtime overhead beyond the mock call. The test grows one function call per assertion and gains a machine-verifiable contract.

## Fidelity vs cost trade-off (release gate axis)

The 3 dogfood apps (`dogfood-kafka-event-pipeline` + `dogfood-redpanda-schema-registry` + `dogfood-nats-jetstream`) each produce a **fidelity report** that measures the mock behaviour against the real runtime. The report walks the same 5-op trace shape through both surfaces and computes a fidelity ratio in `[0, 1]`.

Three properties are load-bearing.

- **Fidelity ≥ 0.7 is the release-gate floor.** Below that the mock is lying to the caller — a test that passes against the mock but fails against a real broker tells the reviewer the mock needs work.
- **Fidelity 1.0 is a warning sign, not a goal.** A mock that reproduces Kafka byte-for-byte is either a real broker in disguise (slow) or a mock that tracks every irrelevant coordinator detail (brittle). The target is 0.85–0.95 with intentional divergence documented per axis.
- **The fidelity harness runs Layer 3, not Layer 1.** Layer 1 (unit tests) drives the mock. Layer 3 (fidelity harness) drives both mock and real, diffs traces, and emits the fidelity ratio. Layer 2 (integration) rides on the mock — the fidelity harness is what tells the reviewer the mock is worth riding on.

The `evaluateReleaseGate` 11-axis contract reads the fidelity ratio through the common 7-axis branch, alongside coverage / test count / perf p95 / mutation kill rate. The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply to streaming surfaces — there is no token pricing to measure.

## Test count baseline

The v1.20 streaming harness ships the following behaviour test counts per axis.

- Axis 1 (producer) — `packages/streaming/tests/kafka.test.ts` producer group × 7 + `packages/streaming/tests/redpanda.test.ts` × 6 + `packages/streaming/tests/nats.test.ts` core pub × 7 = **20 tests**
- Axis 2 (consumer) — `packages/streaming/tests/kafka.test.ts` consumer group × 7 + admin × 4 + topic accessors × 3 = **14 tests**
- Axis 3 (exactly-once) — `packages/streaming/tests/exactly-once.test.ts` × 11 = **11 tests**
- Axis 4 (DLQ) — `packages/streaming/tests/dlq.test.ts` × 9 = **9 tests**
- Axis 5 (schema registry) — `packages/streaming/tests/schema-registry.test.ts` × 15+ = **15+ tests**

Every count sits above the 10-test release-gate floor (Axis 4 is at 9 by design — DLQ semantics are narrow) so the 11-axis check passes without special-casing the streaming surfaces.

## References

- [Tutorial 31 — Kafka event pipeline (producer + consumer group + exactly-once + DLQ)](../tutorials/31-kafka-event-pipeline)
- [Tutorial 32 — Redpanda + schema registry (Avro schemas + evolution + compatibility)](../tutorials/32-redpanda-schema-registry)
- [Tutorial 33 — NATS JetStream (persistent streams + KV + Object store + subject routing)](../tutorials/33-nats-jetstream)
- [Migration v1.19 → v1.20](../migrations/v1.19-to-v1.20)
- v1.13 baseline — [Realtime testing (time-axis mock SSOT)](./realtime-testing)
