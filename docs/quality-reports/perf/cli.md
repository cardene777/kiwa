# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runSpecToTest | 0.10ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.35ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| runSpecToTest | 1309920 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.10ms |
| p99 | 0.11ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.23ms |
| total | 8.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.09ms | -0.00ms | -4.95% |
| p95 | 0.10ms | 0.10ms | -0.00ms | -3.89% |
| p99 | 0.11ms | 0.12ms | -0.01ms | -7.14% |
| mean | 0.08ms | 0.09ms | -0.00ms | -3.53% |
| min | 0.07ms | 0.08ms | -0.00ms | -5.61% |
| max | 0.23ms | 0.12ms | +0.11ms | +94.94% |
| total | 8.49ms | 8.80ms | -0.31ms | -3.53% |

