# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upsertOne | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +23969%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.02ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| fetchById | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +133333%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.01ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -12720 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -1216 B | 0 B | 102400 B | yes | PASS |
| fetchById | -6768 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.15ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.11% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.79% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -20.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +59.04% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.15ms | 0.01ms | +0.14ms | +1274.30% |
| total | 0.36ms | 0.23ms | +0.14ms | +59.04% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.13ms |
| mean | 0.01ms |
| stdev | 0.07ms |
| min | 0.00ms |
| max | 0.97ms |
| total | 2.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -33.34% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +48.82% |
| p99 | 0.13ms | 0.02ms | +0.11ms | +433.46% |
| mean | 0.01ms | 0.01ms | +0.01ms | +101.76% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.30% |
| max | 0.97ms | 0.03ms | +0.94ms | +3695.87% |
| total | 2.69ms | 1.33ms | +1.36ms | +101.76% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.53% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.07% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.01ms | 0.01ms | -0.00ms | -13.15% |
| total | 0.07ms | 0.07ms | -0.00ms | -0.07% |

