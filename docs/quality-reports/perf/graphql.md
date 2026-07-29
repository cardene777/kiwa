# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseGraphQLOperation | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +28956%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| executeQuery | 0.01ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| clientQuery | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +14309%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | 1240 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 32232 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 41856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +21.94% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.43% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +5.87% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.17% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.33% |
| max | 0.01ms | 0.08ms | -0.06ms | -82.11% |
| total | 0.29ms | 0.31ms | -0.02ms | -7.17% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.72ms |
| mean | 0.08ms |
| stdev | 0.81ms |
| min | 0.00ms |
| max | 9.85ms |
| total | 16.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.11% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +210.98% |
| p99 | 0.72ms | 0.01ms | +0.72ms | +11057.00% |
| mean | 0.08ms | 0.00ms | +0.08ms | +6381.10% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.59% |
| max | 9.85ms | 0.01ms | +9.84ms | +104921.78% |
| total | 16.88ms | 0.26ms | +16.62ms | +6381.10% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.13ms |
| mean | 0.08ms |
| stdev | 1.00ms |
| min | 0.00ms |
| max | 14.10ms |
| total | 16.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.65% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.73% |
| p99 | 0.13ms | 0.01ms | +0.12ms | +961.27% |
| mean | 0.08ms | 0.00ms | +0.08ms | +4809.04% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.69% |
| max | 14.10ms | 0.04ms | +14.06ms | +37208.82% |
| total | 16.24ms | 0.33ms | +15.91ms | +4809.04% |

