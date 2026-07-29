# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runSpecToTest | 0.39ms | 20ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 1.65ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 15240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.39ms |
| p99 | 0.61ms |
| mean | 0.17ms |
| stdev | 0.12ms |
| min | 0.09ms |
| max | 0.87ms |
| total | 16.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.12ms | +0.00ms | +1.21% |
| p95 | 0.39ms | 0.65ms | -0.26ms | -40.06% |
| p99 | 0.61ms | 0.98ms | -0.37ms | -37.57% |
| mean | 0.17ms | 0.20ms | -0.04ms | -18.03% |
| min | 0.09ms | 0.09ms | +0.01ms | +5.94% |
| max | 0.87ms | 1.85ms | -0.97ms | -52.65% |
| total | 16.66ms | 20.33ms | -3.67ms | -18.03% |

