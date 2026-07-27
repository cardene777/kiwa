# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runSpecToTest | 0.20ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.75ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 13880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.20ms |
| p99 | 0.25ms |
| mean | 0.13ms |
| stdev | 0.04ms |
| min | 0.08ms |
| max | 0.41ms |
| total | 12.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.13ms | -0.01ms | -9.60% |
| p95 | 0.20ms | 0.24ms | -0.04ms | -18.48% |
| p99 | 0.25ms | 0.26ms | -0.00ms | -1.27% |
| mean | 0.13ms | 0.14ms | -0.01ms | -8.39% |
| min | 0.08ms | 0.09ms | -0.01ms | -7.86% |
| max | 0.41ms | 0.28ms | +0.14ms | +49.20% |
| total | 12.95ms | 14.13ms | -1.19ms | -8.39% |

