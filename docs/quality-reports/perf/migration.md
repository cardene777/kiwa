# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runUp | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +37218%) 以上の悪化が必要) |
| diffSchema | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| clientCreate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +170039%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -2608 B | 0 B | 102400 B | yes | PASS |
| diffSchema | 296 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 424 B | 0 B | 102400 B | yes | PASS |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.27% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +16.38% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.55% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.87% |
| total | 0.16ms | 0.15ms | +0.01ms | +6.55% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.15% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +105.29% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +116.13% |
| mean | 0.00ms | 0.00ms | +0.00ms | +79.49% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.14ms | 0.01ms | +0.13ms | +1586.66% |
| total | 0.49ms | 0.27ms | +0.22ms | +79.49% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +50.61% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.71% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | -0.00ms | -25.98% |
| total | 0.06ms | 0.06ms | -0.00ms | -0.71% |

