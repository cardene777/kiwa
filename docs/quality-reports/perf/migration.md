# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runUp | 0.00ms | 5ms | PASS | stable |
| diffSchema | 0.00ms | 5ms | PASS | stable |
| clientCreate | 0.00ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.01ms | 10ms | PASS |
| diffSchema | 0.01ms | 10ms | PASS |
| clientCreate | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| runUp | 488704 B | 0 B | 102400 B | PASS |
| diffSchema | 888688 B | 0 B | 102400 B | PASS |
| clientCreate | 260544 B | 0 B | 102400 B | PASS |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.79% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.77% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.25% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.28% |
| total | 0.15ms | 0.15ms | +0.00ms | +3.25% |

### diffSchema

# Perf Report — diffSchema.serial

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.79% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -37.90% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.81% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.48% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.72% |
| total | 0.23ms | 0.24ms | -0.01ms | -3.81% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -73.04% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.27% |
| mean | 0.00ms | 0.00ms | -0.00ms | -32.13% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -67.64% |
| total | 0.05ms | 0.08ms | -0.02ms | -32.13% |

