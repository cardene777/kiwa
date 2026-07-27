# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| writeFile | 0.22ms | 20ms | PASS | stable |
| readFile | 0.21ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.42ms | 40ms | PASS |
| readFile | 0.16ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 1280 B | -16685 B | 102400 B | yes | PASS |
| readFile | -9096 B | -45729 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.22ms |
| p99 | 0.31ms |
| mean | 0.14ms |
| stdev | 0.05ms |
| min | 0.09ms |
| max | 0.37ms |
| total | 13.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.14ms | -0.01ms | -9.67% |
| p95 | 0.22ms | 0.22ms | +0.00ms | +1.07% |
| p99 | 0.31ms | 0.28ms | +0.04ms | +13.14% |
| mean | 0.14ms | 0.15ms | -0.01ms | -8.11% |
| min | 0.09ms | 0.10ms | -0.01ms | -5.74% |
| max | 0.37ms | 0.29ms | +0.08ms | +28.29% |
| total | 13.72ms | 14.93ms | -1.21ms | -8.11% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.21ms |
| p99 | 0.34ms |
| mean | 0.10ms |
| stdev | 0.07ms |
| min | 0.04ms |
| max | 0.52ms |
| total | 9.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.06ms | +0.02ms | +39.47% |
| p95 | 0.21ms | 0.08ms | +0.12ms | +144.82% |
| p99 | 0.34ms | 0.14ms | +0.21ms | +149.65% |
| mean | 0.10ms | 0.06ms | +0.04ms | +63.13% |
| min | 0.04ms | 0.04ms | -0.00ms | -11.81% |
| max | 0.52ms | 0.17ms | +0.35ms | +213.38% |
| total | 9.81ms | 6.01ms | +3.80ms | +63.13% |

