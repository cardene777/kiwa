# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderSolid | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +21404%) 以上の悪化が必要) |
| mockSignalEffect | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +25000%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.01ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | 271696 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | -25680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.74% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -27.75% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -37.50% |
| min | 0.00ms | 0.00ms | -0.00ms | -31.61% |
| max | 0.01ms | 0.02ms | -0.01ms | -42.21% |
| total | 0.19ms | 0.31ms | -0.12ms | -37.50% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -27.27% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.34% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +25.13% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.31% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -17.96% |
| total | 0.25ms | 0.32ms | -0.06ms | -20.31% |

