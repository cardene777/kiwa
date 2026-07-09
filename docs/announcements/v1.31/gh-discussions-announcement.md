# kiwa v1.31 released — Streaming 深化 II (@kiwa-lab/streaming v0.3.0 + 8 axis advanced streaming semantics + real driver + 縦深化 pair 第 3 pair 完成 + 9 milestone snippet streak)

v1.31 is out. v1.20 (Streaming mock) → v1.31 (Streaming real driver + Kafka raw protocol + Redpanda schema admin + NATS JetStream durable consumer) で **縦深化 pair pattern 第 3 pair 完成** (v1.21→v1.22 Auth + v1.13→v1.28 Realtime に続く 3 pair 連続化)。 v1.30 quality gate maximum grid (13 axis) を streaming real driver に適用、 kiwa の縦深化戦略 SSOT を確立した milestone。

## What shipped

- **`@kiwa-lab/streaming` v0.2.0 → v0.3.0 minor bump**。 8 axis advanced streaming semantics + real driver env-gate + 3 provider (Kafka / Redpanda / NATS) neutral state machine を追加。 v0.2 API は完全維持 (additive-only 契約)。
- **v1.31-1 streaming v0.3 8 axis semantics** (Issue #1009)。 `packages/streaming/src/semantics/*` に 1 axis = 1 file の pure state machine helper を実装。 Kafka raw protocol (KIP-98 idempotent + transaction coordinator + fetch session + ISR) / Kafka consumer group (rebalance + static membership + cooperative + heartbeat) / Redpanda schema evolution (Avro/Protobuf/JSON compatibility + subject strategy + reference) / Redpanda transactions (TxnCoordinator + producer id + epoch fencing) / NATS JetStream durable (durable consumer + ack pending + max deliver + backoff) / NATS KV/Object Store (bucket + revision + watch + object chunking + LZ4) / Streaming exactly-once (transactional producer + read committed + isolation) / Consumer lag telemetry (offset lag + time lag + partition + high watermark) の 8 axis を統一実装、 3 provider × 8 axis fidelity harness 24 row grid を確立。
- **v1.31-2 dogfood-kafka-event-pipeline v2** (Issue #1010)。 Kafka raw + KIP-98 idempotent + transactional producer + confluent-kafka testcontainers + Playwright e2e + real Kafka 3.7 + Schema Registry mock 統合を追加、 mock only mode + `KIWA_MODE=real` opt-in の 2 layer 走査。
- **v1.31-3 dogfood-redpanda-schema-registry v2** (Issue #1011)。 Redpanda v23+ testcontainers + Redpanda Console API + BACKWARD/FORWARD/FULL compatibility check を追加、 schema evolution strict transition guard で downgrade violation を fail-fast 検出。
- **v1.31-4 dogfood-nats-jetstream v2** (Issue #1012)。 NATS 2.10+ testcontainers + JetStream durable + KV revision + Object chunking を追加、 durable consumer max deliver + backoff policy + Object Store LZ4 圧縮を統一 mock 化。
- **v1.31-5 docs 補強** (Issue #1013)。 `docs/tutorials/58-kafka-raw-protocol.md` (Kafka raw + KIP-98 walkthrough) + `docs/tutorials/59-redpanda-schema-evolution.md` (BACKWARD/FORWARD/FULL compatibility) + `docs/tutorials/60-nats-jetstream-durable.md` (durable consumer + KV/Object Store) + `docs/migrations/v1.30-to-v1.31.md` (additive-only、 breaking change 0) + `docs/concepts/streaming-real-driver-testing.md` (8 axis SSOT + real driver 環境変数 SSOT + provider fidelity table) + `packages/streaming/tests/docs-tutorial-v1.31.test.ts` snippet validation で **9 milestone 連続 snippet validation pattern** (v1.23-v1.31) 達成。
- **v1.31-6 publish** (Issue #1014, this PR)。 `.claude-plugin/plugin.json` 1.30.0 → 1.31.0 + description v1.31 section + streaming keywords + Roadmap ✅ v1.31 row + announcement 4 file + release-smoke `v1-31-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_31_PAGES` (5 page render check) + `pnpm run release` 経由 npm publish (`@kiwa-lab/streaming` v0.3.0) + `/docs-publish-kiwa` 経由 gh-pages 反映。

## Numbers

- **6 sub-Issues resolved** (#1009 / #1010 / #1011 / #1012 / #1013 / #1014)
- **6 PRs merged** (v1.31-1 through v1.31-6)
- **1 npm minor bump** (`@kiwa-lab/streaming` v0.2.0 → v0.3.0) — kiwa runtime fixture **35 packages** 維持
- **8 axis advanced streaming semantics** (Kafka raw / consumer group / Redpanda schema / transactions / NATS durable / KV/Object / exactly-once / consumer lag)
- **3 provider fidelity harness** (Kafka / Redpanda / NATS × 8 axis = 24 row grid)
- **3 dogfood streaming app v2** (kafka-event-pipeline v2 + redpanda-schema-registry v2 + nats-jetstream v2)
- **9 milestone 連続 snippet validation streak** (v1.23-v1.31) — payment / edge / perf-harness / orm / quality-metrics / realtime / release-invariants / a11y / streaming

## Why 縦深化 pair pattern 第 3 pair

kiwa milestone は縦深化 pair pattern (基礎 mock milestone → 深化 II milestone で real driver + advanced semantics) を 3 pair 連続確立してきた。

- **Auth pair (v1.21 → v1.22)** ... `@kiwa-lab/auth` v0.4 4 protocol adapter (mock only) → Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver + a11y axe-core gate)
- **Realtime pair (v1.13 → v1.28)** ... `@kiwa-lab/realtime` v0.1 4 provider 5 base semantics (mock only) → WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
- **Streaming pair (v1.20 → v1.31、 this)** ... `@kiwa-lab/streaming` v0.1 3 provider 5 semantics (mock only) → Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)

3 pair 連続化で kiwa の縦深化戦略が SSOT 化された。 basic mock → advanced real driver の 2 phase pair を追加 provider に横展開する pattern が確立。

## 20 → 21 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → **v1.31 (Streaming 深化 II)**。 v1.11 以降 21 milestone 連続完遂、 全 sub-Issue land 維持。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Streaming depth III — Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity
- Auth depth III — WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix)

Feedback welcome on which of these should land next.

## Try it

```bash
pnpm add -D @kiwa-lab/streaming @kiwa-lab/core
```

See the [migration guide](https://cardene777.github.io/kiwa/migrations/v1.30-to-v1.31) for upgrade notes. Zero breaking changes.

## Thanks

Thanks to everyone who reviewed the v1.31 sub-Issues, tested `@kiwa-lab/streaming` v0.3 pre-release, and helped shape the 縦深化 pair pattern SSOT. On to v2.0.
