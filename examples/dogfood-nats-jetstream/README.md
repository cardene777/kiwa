# dogfood-nats-jetstream

Dogfood app for v1.31-4 — a NATS JetStream + KV + Object Store + subject
routing pipeline that exercises **4 v1 patterns + 4 v2 axes** from
`@kiwa-test/streaming` v0.3.

## v1 patterns

1. **JetStream persistent stream** — declare a stream over `orders.>`,
   publish N `OrderEvent`s with monotonically increasing seqs, pull
   through a durable consumer, ack every message except the last, then
   simulate a redelivery by re-fetching via a fresh consumer.
2. **KV Store** — put + get + delete + revision-based versioning. The
   bucket-wide revision monotonically bumps on every mutation so tests
   can assert against optimistic concurrency behaviour.
3. **Object Store** — put + get + list + delete + digest + size metadata
   with a chunk-size aware helper that reports the chunk count
   deterministically without the mock modelling the real wire protocol.
4. **Subject-based routing** — literal + `*` single-token wildcard + `>`
   catch-all wildcard + queue group round-robin delivery.

## v2 axes

5. **JetStream durable consumer** — spin up a durable consumer with
   `ackWaitMs=100` + `maxDeliver=2` + `backoff=[50,200,800]`. Deliver +
   nack seq #2 to trigger a backoff-driven redelivery, expire the un-
   touched seq #3 + #4 via `sweepExpired`, then drive seq #3 past
   `maxDeliver` so it lands in the quarantine window. Reports the ack
   pending / quarantined / ack floor / backoff schedule counters.
6. **KV bucket revision** — `historyDepth=5` walker. A key is `put` +
   updated 3 times + `delete`d (tombstone), the `historyKv` result carries
   the full 5-revision chain, and a `watchKv` iterator drains the same
   events in order. Verifies `getKv` after tombstone returns `null`.
7. **Object Store chunking** — 1024-byte deterministic payload under
   `chunkSizeBytes=256` + `compression='lz4'`. The LZ4 prefix tag pads the
   compressed stream to 1028 bytes → 5 chunks with distinct digests.
   `reassembleObject` returns the original bytes.
8. **Testcontainers probe** — NATS 2.10+ (`nats:2.10.20-alpine`) as a
   duck-typed testcontainer (peer-dep free, degrades to `NATS_ENV_MISSING`
   when the `testcontainers` module is missing). Mirrors the sibling
   Kafka + Redpanda dogfood shape.

## Adapters

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa-test/streaming`'s NatsMock +
  the streaming v0.3 durable / kv-object semantics. Default for CI +
  local.
- `makeRealAdapter()` — requires `KIWA_MODE=real` + `NATS_KEY` (or a
  pre-provisioned `container` handle) to opt in. Reports
  `NATS_ENV_MISSING` otherwise. Semantic ops (jetstream / kv / object /
  routing / durable / kv-revision / object-chunking) still report
  `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.31-4 scope;
  `driveTestcontainersProbe` fully wires against the live env.

## Layout

```
src/
  jetstream/index.ts       # v1 stream + durable consumer + ack + redelivery
  jetstream/durable.ts     # v2 ack_wait + maxDeliver + backoff scenario
  kv/index.ts              # v1 put / get / delete / watch + revision bookkeeping
  kv/revision.ts           # v2 historyDepth walk + tombstone + watch drain
  object/index.ts          # v1 put / get / delete / list + chunk metadata
  object/chunking.ts       # v2 chunk boundary + LZ4 compression + reassembly
  routing/index.ts         # v1 literal + `*` + `>` + queue group round-robin
  adapters/
    interface.ts           # 9-op driver contract (5 v1 + 4 v2)
    mock.ts                # in-process NatsMock + streaming v0.3 semantics adapter
    real.ts                # env-driven adapter + NATS 2.10+ duck-typed testcontainers
  flows/
    nats-flows.ts          # higher-level flows over the adapter (9 ops)
    fidelity.ts            # trace diff + quality-metrics 13-axis release-gate
tests/
  jetstream.test.ts              # T-DNJ-* — persistent stream semantics (v1)
  kv.test.ts                     # T-DNK-* — KV store semantics (v1)
  object.test.ts                 # T-DNO-* — object store semantics (v1)
  routing.test.ts                # T-DNR-* — routing semantics (v1)
  durable-consumer.test.ts       # T-DND-* — durable consumer scenario (v2)
  kv-revision.test.ts            # T-DNK-1xx — bucket revision history (v2)
  object-chunking.test.ts        # T-DNO-1xx — chunk boundary + LZ4 (v2)
  testcontainers-probe.test.ts   # T-DNT-* — probe + tc module inject (v2)
  e2e-mock-mode.test.ts          # T-DNE-M-* — 9-op adapter surface
  fidelity-report.test.ts        # T-DNF-* — harness output + 13-axis gate
  emit-fidelity-report.test.ts   # T-DNE-EM-* — quality-report/ writeback
  e2e/                           # Playwright e2e (v2)
    fixture.ts                   # ad-hoc HTTP server binding 9 ops to routes
    v1-legacy-flow.spec.ts       # jetstream + routing legacy journey
    durable-kv-flow.spec.ts      # durable + kv revision + object chunking
    testcontainers-probe-flow.spec.ts # testcontainers probe journey
  perf/
    dogfood-nats-jetstream.perf.ts # 3-layer perf harness
```

## Running

```sh
# Mock-mode tests (default, v1 + v2 combined).
pnpm --filter dogfood-nats-jetstream test

# Playwright e2e (v2, skips cleanly if browsers not installed).
pnpm --filter dogfood-nats-jetstream test:e2e

# Perf sweep (3-layer harness — serial + parallel + live).
pnpm --filter dogfood-nats-jetstream test:perf

# Real-mode — requires KIWA_MODE=real + NATS_KEY + a running NATS broker.
KIWA_MODE=real \
  NATS_KEY=kiwa-real-1 \
  NATS_URL=nats://localhost:4222 \
  pnpm --filter dogfood-nats-jetstream test
```

## Fidelity report

`tests/emit-fidelity-report.test.ts` writes the release-gate report to
`quality-report/fidelity-latest.md` + `.json` after every run — the v2
quality report doc `docs/quality-reports/streaming/nats-jetstream-v2.md`
is derived from this snapshot and lists the 13-axis release gate verdict
(7 common + mutation.tier + a11y.tier on the SSOT lane grid).
