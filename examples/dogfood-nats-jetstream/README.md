# dogfood-nats-jetstream

Dogfood app for v1.20-4 — a NATS pipeline that exercises the 4 patterns
`@kiwa-test/streaming` promises for NATS:

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

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa-test/streaming`'s NatsMock
  (JetStream + KV + Object Store) fixture. Default for CI + local.
- `makeRealAdapter()` — probes a live NATS broker via `NATS_URL`
  (TCP aliveness on the first host). Env-skip when the var is missing.
  Higher-level ops report `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.20-4
  scope so the fidelity harness records a well-defined divergence.

## Layout

```
src/
  jetstream/index.ts   # stream + durable consumer + ack + redelivery
  kv/index.ts          # put / get / delete / watch + revision bookkeeping
  object/index.ts      # put / get / delete / list + chunk metadata
  routing/index.ts     # literal + `*` + `>` + queue group round-robin
  adapters/
    interface.ts       # 5-op driver contract shared by mock/real
    mock.ts            # in-process NatsMock-backed adapter
    real.ts            # NATS_URL-driven adapter (skip mode default)
  flows/
    nats-flows.ts      # higher-level flows over the adapter
    fidelity.ts        # trace diff + quality-metrics release-gate report
tests/
  jetstream.test.ts              # T-DNJ-* — persistent stream semantics
  kv.test.ts                     # T-DNK-* — KV store semantics
  object.test.ts                 # T-DNO-* — object store semantics
  routing.test.ts                # T-DNR-* — routing semantics
  e2e-mock-mode.test.ts          # T-DNE-M-* — 5-op adapter surface E2E
  fidelity-report.test.ts        # T-DNF-* — fidelity harness output
  emit-fidelity-report.test.ts   # T-DNE-EM-* — quality-report/ writeback
  perf/
    dogfood-nats-jetstream.perf.ts # 3-layer perf harness
```

## Running

```sh
# Mock-mode tests (default).
pnpm --filter dogfood-nats-jetstream test

# Perf sweep (3-layer harness — serial + parallel + live).
pnpm --filter dogfood-nats-jetstream test:perf

# Real-mode (requires a running NATS broker).
NATS_URL=nats://localhost:4222 pnpm --filter dogfood-nats-jetstream test
```

## Fidelity report

`tests/emit-fidelity-report.test.ts` writes the release-gate report to
`quality-report/fidelity-latest.md` + `.json` after every run — the parent
Issue's `docs/quality-reports/streaming/nats-jetstream.md` is derived from
this snapshot.
