# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchOverLoopback | 0.42ms | 20ms | PASS | stable (差 0.41ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 0.87ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 216088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.18ms |
| p95 | 0.42ms |
| p99 | 0.83ms |
| mean | 0.23ms |
| stdev | 0.13ms |
| min | 0.15ms |
| max | 0.97ms |
| total | 22.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.18ms | 0.21ms | -0.03ms | -12.49% |
| p95 | 0.42ms | 0.83ms | -0.41ms | -49.29% |
| p99 | 0.83ms | 1.14ms | -0.31ms | -26.86% |
| mean | 0.23ms | 0.32ms | -0.09ms | -28.60% |
| min | 0.15ms | 0.15ms | -0.01ms | -3.78% |
| max | 0.97ms | 1.53ms | -0.56ms | -36.56% |
| total | 22.86ms | 32.01ms | -9.15ms | -28.60% |

