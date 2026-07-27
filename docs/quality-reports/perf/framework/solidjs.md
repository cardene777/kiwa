# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderSolid | 0.00ms | 5ms | PASS | stable |
| mockSignalEffect | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.01ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | 3024 B | -30416 B | 102400 B | yes | PASS |
| mockSignalEffect | -17680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.85% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +2.48% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.30% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +17.85% |
| total | 0.18ms | 0.17ms | +0.01ms | +5.30% |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.64% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.00% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.38% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.59% |
| total | 0.27ms | 0.26ms | +0.01ms | +5.00% |

