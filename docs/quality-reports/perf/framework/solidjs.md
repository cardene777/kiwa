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
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | -3432 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | 5024 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.92% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.18% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.00ms | +2.35% |
| total | 0.17ms | 0.17ms | +0.01ms | +3.18% |

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
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +51.10% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +3.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.66% |
| max | 0.02ms | 0.01ms | +0.01ms | +84.26% |
| total | 0.27ms | 0.26ms | +0.02ms | +6.58% |

