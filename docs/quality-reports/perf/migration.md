# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runUp | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +37218%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diffSchema | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +32251%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| clientCreate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +170039%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.04ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | 3320 B | -47602 B | 102400 B | yes | PASS |
| diffSchema | 440 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 2656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.10ms |
| min | 0.00ms |
| max | 1.36ms |
| total | 1.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -23.06% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +70.91% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +34.26% |
| mean | 0.01ms | 0.00ms | +0.01ms | +926.55% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 1.36ms | 0.01ms | +1.35ms | +10967.87% |
| total | 1.55ms | 0.15ms | +1.40ms | +926.55% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.17ms |
| min | 0.00ms |
| max | 2.35ms |
| total | 2.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -21.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.21% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +57.46% |
| mean | 0.01ms | 0.00ms | +0.01ms | +848.58% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 2.35ms | 0.01ms | +2.34ms | +28781.02% |
| total | 2.61ms | 0.27ms | +2.33ms | +848.58% |

### clientCreate

# Perf Report — clientCreate.serial

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
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.26% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +191.62% |
| mean | 0.00ms | 0.00ms | +0.00ms | +36.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.02ms | 0.01ms | +0.01ms | +40.14% |
| total | 0.08ms | 0.06ms | +0.02ms | +36.53% |

