## 0.1.1

### Patch Changes

- b0a7e8b: feat(v1.13-1): `@kiwa-test/perf-harness` v0.1.0 — 5 target generic performance harness

  v1.13 milestone (Issue #707/#708, parent #709) — first release of the generic perf harness that feeds the release gate's `perf.p95Ms` axis for arbitrary workloads.

  ## What's added

  - 5 measurement targets — `bench.request` (HTTP surface) / `bench.function` (pure fn) / `bench.stream` (async iterators) / `bench.batch` (bulk ops) / `bench.worker` (Web/Node worker RPC)
  - p50 / p95 / p99 latency distribution + regression detection against a persisted baseline
  - Baseline snapshot format under `.perf-baseline.json` with configurable tolerance windows
  - Release-gate integration — emits a `QualityReport` with `perf.p95Ms` populated, compatible with `@kiwa-test/quality-metrics` v0.2 11-axis evaluation
  - `/kiwa-perf` skill wiring (`.claude/skills/kiwa-perf/`) — Layer-2 orchestration that runs benchmarks + updates baselines + drops the report into `docs/quality-reports/perf/`

  ## Backward compatibility

  New package, no breaking changes to existing consumers. Optional adoption — projects without a perf pass keep the default 7-axis / 11-axis evaluation path unchanged.

  Refs #708, #709.

- Updated dependencies [797e5ea]
  - @kiwa-test/quality-metrics@0.2.0

## 0.1.0 - 2026-07-02

- Initial release: measure / regression / baseline / gate / report
