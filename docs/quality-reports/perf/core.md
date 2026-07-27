# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseSpec | 0.02ms | 5ms | PASS | stable |
| createPool | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.08ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | 2736 B | 0 B | 102400 B | yes | PASS |
| createPool | -14840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 1.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -16.37% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.12% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +23.86% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.58% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.60% |
| max | 0.09ms | 0.04ms | +0.06ms | +146.62% |
| total | 1.66ms | 1.74ms | -0.08ms | -4.58% |

### createPool

# Perf Report — createPool.serial

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
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.89% |
| p95 | 0.00ms | 0.02ms | -0.01ms | -77.87% |
| p99 | 0.01ms | 0.05ms | -0.03ms | -73.80% |
| mean | 0.00ms | 0.01ms | -0.00ms | -73.82% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.08% |
| max | 0.02ms | 0.40ms | -0.38ms | -95.91% |
| total | 0.35ms | 1.33ms | -0.98ms | -73.82% |

