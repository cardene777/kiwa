# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runSpecToTest | 0.24ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.78ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 12472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.16ms |
| p95 | 0.24ms |
| p99 | 0.32ms |
| mean | 0.17ms |
| stdev | 0.04ms |
| min | 0.10ms |
| max | 0.33ms |
| total | 16.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.16ms | 0.13ms | +0.03ms | +22.04% |
| p95 | 0.24ms | 0.24ms | +0.00ms | +0.76% |
| p99 | 0.32ms | 0.26ms | +0.06ms | +23.90% |
| mean | 0.17ms | 0.14ms | +0.03ms | +19.14% |
| min | 0.10ms | 0.09ms | +0.01ms | +15.95% |
| max | 0.33ms | 0.28ms | +0.05ms | +19.38% |
| total | 16.84ms | 14.13ms | +2.70ms | +19.14% |

