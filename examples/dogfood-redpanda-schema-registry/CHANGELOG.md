# dogfood-redpanda-schema-registry

## 0.0.3

### v1.31-3 — schema evolution + Redpanda Console admin + testcontainers pair + Playwright e2e

- 4 v2 adapter ops added to the 5-op v1 surface (9 ops total):
  - `driveEvolutionTransitive` — v1 → v2 → v3 chain walk + BACKWARD_TRANSITIVE
    variant rejects a candidate that immediate BACKWARD would accept but that
    breaks a prior version (added-required-field vs v1).
  - `driveSubjectStrategies` — probes topic-name / record-name /
    topic-record-name against the same topic + record + roundtrips a
    fresh register per strategy.
  - `driveConsoleAdmin` — walks the Redpanda Console v2.x admin API
    surface (`/api/subjects` + `/api/config/{subject}` +
    `/api/schemas/ids/{id}` + `/api/health`). Mock mode uses a
    deterministic fixture fetch; real mode hits the container-mapped URL.
  - `driveTestcontainersProbe` — mirrors the Kafka sibling shape
    (bootstrap + Console URL + Schema Registry URL + image tags +
    reachable flag).
- Real adapter promotes the v1.20-3 aliveness probe to a Redpanda v23+
  (`redpandadata/redpanda:v23.3.5`) + Console v2.x
  (`redpandadata/console:v2.4.5`) testcontainers pair. Peer-dependency-free
  duck typing: a missing `testcontainers` module degrades to
  `REDPANDA_ENV_MISSING`.
- Fidelity harness upgraded to the 13-axis release gate (7 common +
  mutation.tier + a11y.tier when tier context supplied). Baseline is
  `a11yBaseline: { critical: 0, serious: 0, moderate: 0, minor: 0 }`
  because the dogfood is headless.
- Playwright e2e — 3 spec files (register + evolution / transitive +
  strategy / console + testcontainers) drive the mock adapter's 9-op
  surface behind an ad-hoc Node HTTP server. 6 tests total; skips
  cleanly when the Playwright browser cache is empty.
- Tests: 44 behavior + 3 integration + 11 e2e + 6 Playwright e2e = 64
  total.

## 0.0.2

### Patch Changes

- Updated dependencies [1fab5c4]
  - @kiwa-lab/streaming@0.2.0
