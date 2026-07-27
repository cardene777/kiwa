# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runSpecToTest | 0.22ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 0.72ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 14048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.14ms |
| p95 | 0.22ms |
| p99 | 0.27ms |
| mean | 0.15ms |
| stdev | 0.04ms |
| min | 0.09ms |
| max | 0.35ms |
| total | 14.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.13ms | +0.01ms | +8.05% |
| p95 | 0.22ms | 0.24ms | -0.02ms | -8.81% |
| p99 | 0.27ms | 0.26ms | +0.01ms | +4.45% |
| mean | 0.15ms | 0.14ms | +0.01ms | +5.55% |
| min | 0.09ms | 0.09ms | -0.00ms | -3.81% |
| max | 0.35ms | 0.28ms | +0.07ms | +25.73% |
| total | 14.92ms | 14.13ms | +0.78ms | +5.55% |

