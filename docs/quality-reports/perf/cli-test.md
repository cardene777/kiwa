# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| writeFile | 0.23ms | 20ms | PASS | stable |
| readFile | 0.13ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.41ms | 40ms | PASS |
| readFile | 0.14ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 2496 B | -20048 B | 102400 B | yes | PASS |
| readFile | -9096 B | -27830 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.14ms |
| p95 | 0.23ms |
| p99 | 0.28ms |
| mean | 0.15ms |
| stdev | 0.05ms |
| min | 0.10ms |
| max | 0.41ms |
| total | 15.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.14ms | +0.00ms | +0.99% |
| p95 | 0.23ms | 0.22ms | +0.01ms | +5.29% |
| p99 | 0.28ms | 0.28ms | +0.01ms | +2.67% |
| mean | 0.15ms | 0.15ms | +0.00ms | +1.32% |
| min | 0.10ms | 0.10ms | +0.00ms | +2.89% |
| max | 0.41ms | 0.29ms | +0.12ms | +41.83% |
| total | 15.13ms | 14.93ms | +0.20ms | +1.32% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.07ms |
| p95 | 0.13ms |
| p99 | 0.19ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.21ms |
| total | 7.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.06ms | +0.01ms | +16.43% |
| p95 | 0.13ms | 0.08ms | +0.04ms | +52.33% |
| p99 | 0.19ms | 0.14ms | +0.05ms | +36.21% |
| mean | 0.07ms | 0.06ms | +0.01ms | +18.95% |
| min | 0.04ms | 0.04ms | +0.00ms | +0.61% |
| max | 0.21ms | 0.17ms | +0.05ms | +29.79% |
| total | 7.15ms | 6.01ms | +1.14ms | +18.95% |

