# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseGraphQLOperation | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +28956%) 以上の悪化が必要) |
| executeQuery | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +27092%) 以上の悪化が必要) |
| clientQuery | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +14309%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.21ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -4968 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 26944 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 12192 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.26% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -11.30% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.65% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.60% |
| max | 0.01ms | 0.08ms | -0.06ms | -80.92% |
| total | 0.25ms | 0.31ms | -0.06ms | -18.65% |

### executeQuery

# Perf Report — executeQuery.serial

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +44.68% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.01% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.48% |
| max | 0.01ms | 0.01ms | +0.00ms | +43.55% |
| total | 0.29ms | 0.26ms | +0.03ms | +12.01% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.08ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +165.07% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +73.02% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +91.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +140.83% |
| min | 0.00ms | 0.00ms | +0.00ms | +176.11% |
| max | 0.08ms | 0.04ms | +0.04ms | +118.30% |
| total | 0.80ms | 0.33ms | +0.47ms | +140.83% |

