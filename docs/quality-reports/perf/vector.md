# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upsertOne | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +23969%) 以上の悪化が必要) |
| queryNearestTop5 | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +4194%) 以上の悪化が必要) |
| fetchById | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +133333%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -152 B | -46611 B | 102400 B | yes | PASS |
| queryNearestTop5 | -16368 B | 0 B | 102400 B | yes | PASS |
| fetchById | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

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
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.48% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.92% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +55.31% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.73% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.30% |
| max | 0.02ms | 0.01ms | +0.01ms | +100.01% |
| total | 0.24ms | 0.23ms | +0.01ms | +2.73% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.08% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -13.45% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -41.58% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.40% |
| max | 0.02ms | 0.03ms | -0.01ms | -23.33% |
| total | 1.17ms | 1.33ms | -0.17ms | -12.60% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.98% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.90% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -10.79% |
| total | 0.06ms | 0.07ms | -0.00ms | -5.90% |

