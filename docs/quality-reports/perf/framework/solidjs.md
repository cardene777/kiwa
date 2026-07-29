# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderSolid | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +21404%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +25000%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.01ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | -8056 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | -88 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.06ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -31.84% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +49.68% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +126.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -31.61% |
| max | 0.06ms | 0.02ms | +0.04ms | +178.44% |
| total | 0.33ms | 0.31ms | +0.02ms | +7.92% |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.05% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.57% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +25.49% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.68% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.03% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.59% |
| total | 0.29ms | 0.32ms | -0.03ms | -8.68% |

