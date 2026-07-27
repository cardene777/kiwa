# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runUp | 0.00ms | 5ms | PASS | stable |
| diffSchema | 0.00ms | 5ms | PASS | stable |
| clientCreate | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.01ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | 109456 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -14808 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 1120 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +61.88% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.32% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -33.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +7.69% |
| total | 0.16ms | 0.16ms | -0.00ms | -0.77% |

### diffSchema

# Perf Report — diffSchema.serial

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.84% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +60.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +19.33% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.66% |
| max | 0.01ms | 0.01ms | +0.00ms | +42.70% |
| total | 0.28ms | 0.24ms | +0.05ms | +19.33% |

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
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +32.11% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +84.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.14% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +13.77% |
| total | 0.05ms | 0.05ms | +0.00ms | +8.14% |

