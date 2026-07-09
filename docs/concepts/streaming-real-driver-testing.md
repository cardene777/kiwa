# Streaming real-driver testing — 8 axis × 3 provider = 24 cell grid + testcontainers pattern (SSOT)

kiwa's v1.20 streaming work covered the **5 base semantics** (producer / consumer / exactly-once / DLQ / schema-registry) as unified mocks for Kafka + Redpanda + NATS — the `docs/concepts/streaming-testing.md` doc is the SSOT for those five axes. v1.31 adds **8 advanced axes on top of that base** — the ones production teams hit once their mock-only suite is green but real broker behavior (KIP-98 fencing, txn coordinator races, JetStream backoff, schema evolution boundaries) starts showing up in incident reports. This concept doc is the SSOT for those 8 axes; the tutorials (58-60) and dogfood apps (v1.31-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 advanced axes are cover-oriented — each one names a real-world failure surface every non-trivial streaming pipeline hits within the first 3 months.

| Axis | Real-world failure it catches | v0.3 API |
|---|---|---|
| Kafka raw protocol | "Our idempotent producer duplicated a message after retry" (fencing missed the older-epoch send) | `createKafkaRawProtocol` |
| Kafka consumer group | "The second consumer joined but got 0 partitions" (rebalance did not run, or a static-membership session id was stale) | `createKafkaConsumerGroup` |
| Redpanda schema evolution | "The v3 schema broke old readers" (BACKWARD check was disabled, or the compat mode was FORWARD only) | `createRedpandaSchemaEvolution` |
| Redpanda transactions | "Two producers claimed the same TID and both got committed" (epoch fencing on TxnCoordinator) | `createRedpandaTransactions` |
| NATS JetStream durable | "The consumer keeps redelivering the same message forever" (max_deliver was 0, or ack_wait was too short) | `createNatsJetStreamDurable` |
| NATS KV / Object | "The KV update overwrote a newer revision" (CAS check was absent, or the revision counter reset) | `createNatsKvObject` |
| Cross-provider exactly-once | "Kafka and NATS see the same message twice" (read-committed filter was not applied) | `createExactlyOnceSemantics` |
| Consumer lag telemetry | "The alerting fired 5 minutes after the actual lag spike" (offset-lag vs time-lag distinction was missed) | `createConsumerLagTelemetry` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + provider env, testcontainers, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 58 covers axis 1 in depth, tutorial 59 covers axis 3, tutorial 60 covers axis 5.

## The 3-provider × 8-axis = 24 cell grid

Not every provider covers every axis — NATS has no Kafka wire protocol, Kafka has no `nats.jetstream.js` API, etc. The fidelity harness (`createFidelityHarness()`) surfaces the coverage explicitly so a test iterating the grid can distinguish "not-implemented" from "not-applicable".

| Provider | 1 Kafka raw | 2 Consumer group | 3 Schema evolution | 4 Transactions | 5 JetStream durable | 6 KV / Object | 7 Exactly-once | 8 Consumer lag |
|---|---|---|---|---|---|---|---|---|
| Kafka | implemented | implemented | implemented | implemented | not-applicable | not-applicable | implemented | implemented |
| Redpanda | implemented | implemented | implemented | implemented | not-applicable | not-applicable | implemented | implemented |
| NATS | not-applicable | not-applicable | not-applicable | not-applicable | implemented | implemented | implemented | implemented |

`not-applicable` cells are labeled with a `note` explaining the mismatch (e.g., "NATS has no Kafka wire protocol"; "NATS uses queue groups, modeled via JetStream durable"). A `planned` cell is a "not yet implemented" flag — the fidelity harness lets tests fail on `planned` when the milestone should have shipped it.

### Why `not-applicable` is not `implemented: false`

A "not implemented" cell is a todo; a "not applicable" cell is a design decision. The distinction matters for grid iteration — a test that iterates all 24 cells and asserts "every cell is either `implemented` or `not-applicable`" is a compile-time check that the grid is complete. If NATS were `not-implemented` on `kafka-raw-protocol`, the test would flag it as a todo forever; `not-applicable` says "this pairing is designed out" and the iteration passes.

## The testcontainers pattern

The 3 dogfood apps (v1.31-2/3/4) each expose a `pnpm test:real` command that flips `KIWA_MODE=real` and spins up the provider under testcontainers.

- `examples/dogfood-kafka-event-pipeline` v2 — Confluent Platform 7.6 (Kafka 3.7 + Schema Registry) via `confluent-kafka-python` testcontainers + Playwright e2e that walks the KIP-98 idempotent + txn coordinator + ISR advance path against the real broker.
- `examples/dogfood-redpanda-schema-registry` v2 — Redpanda 23+ testcontainers + Redpanda Console API + 5 compatibility mode (BACKWARD / BACKWARD_TRANSITIVE / FORWARD / FORWARD_TRANSITIVE / FULL) check + Playwright e2e that registers a schema, evolves it, and verifies the compat gate against the real registry.
- `examples/dogfood-nats-jetstream` v2 — NATS 2.10+ testcontainers + JetStream durable consumer + KV bucket revision + Object Store chunking + Playwright e2e that publishes, nacks, waits for the backoff, and asserts on the quarantine list.

The pattern each v2 app follows.

1. Keep the v1 mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:real` command that requires the provider env (`KAFKA_KEY` / `REDPANDA_KEY` / `NATS_KEY`) and pulls the testcontainers image.
3. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real behavior" — the mock gets the fix.
4. Route the e2e through Playwright when the flow crosses UI boundaries (e.g., the schema-registry dogfood app shows a Console admin UI).

## `KIWA_MODE=real` — the env-gate contract

`isRealDriverMode(env)` returns `true` when `env.KIWA_MODE === 'real'`. `requiredKeyFor(axis)` returns the env key that gates the axis's real-driver run:

- `kafka-raw-protocol`, `kafka-consumer-group` → `KAFKA_KEY`
- `redpanda-schema-evolution`, `redpanda-transactions` → `REDPANDA_KEY`
- `nats-jetstream-durable`, `nats-kv-object` → `NATS_KEY`
- `exactly-once`, `consumer-lag-telemetry` → cross-provider, no key required

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required key are present. That means CI stays cheap by default (mock only), the nightly job flips both envs (real driver + testcontainers), and the fidelity harness ties the two together.

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 24-cell grid at v1.31 has 0 `planned` cells — every intended cell is `implemented` or `not-applicable`. When a future milestone adds a 9th axis (e.g., `kafka-log-compaction`), it will start as `planned` for all 3 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.31 does not add a 14th release-gate axis. The 8 streaming axes gate the streaming package's own tests (via `pnpm --filter @kiwa-lab/streaming test`) but do not surface as a per-package `@kiwa-lab/quality-metrics` axis. The reasoning — the fidelity harness is provider-shape-specific, and a package that does not use Kafka / Redpanda / NATS has nothing to assert on. When a future milestone adds a `provider.fidelity` axis that describes "which streaming providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.31 keeps the axis count at 13.

## SSOT boundaries

- The 5 base semantics (producer / consumer / exactly-once / DLQ / schema-registry) live in `docs/concepts/streaming-testing.md`. v1.31 does not modify that doc.
- The 8 advanced axes live in this doc. Tutorials 58-60 and the migration guide (v1.30 → v1.31) link back here for the axis SSOT.
- The 3-provider × 8-axis grid is the harness's data structure. The `createFidelityHarness()` implementation in `packages/streaming/src/semantics/fidelity-harness.ts` is the code SSOT — this doc's grid table is derived from that code.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak). Both use the same pattern; the streaming axes just add provider-specific `_KEY` envs.
