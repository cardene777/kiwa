# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| writeFile | 0.29ms | 20ms | PASS | stable |
| readFile | 0.19ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.39ms | 40ms | PASS |
| readFile | 0.29ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 4016 B | 27864 B | 102400 B | yes | PASS |
| readFile | -9064 B | -62776 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.16ms |
| p95 | 0.29ms |
| p99 | 0.38ms |
| mean | 0.17ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.40ms |
| total | 17.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.16ms | 0.14ms | +0.02ms | +16.40% |
| p95 | 0.29ms | 0.22ms | +0.06ms | +28.91% |
| p99 | 0.38ms | 0.28ms | +0.10ms | +37.44% |
| mean | 0.17ms | 0.15ms | +0.02ms | +16.68% |
| min | 0.11ms | 0.10ms | +0.01ms | +13.97% |
| max | 0.40ms | 0.29ms | +0.11ms | +39.39% |
| total | 17.42ms | 14.93ms | +2.49ms | +16.68% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.09ms |
| p95 | 0.19ms |
| p99 | 0.24ms |
| mean | 0.10ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.24ms |
| total | 10.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.09ms | 0.06ms | +0.03ms | +57.75% |
| p95 | 0.19ms | 0.08ms | +0.11ms | +128.46% |
| p99 | 0.24ms | 0.14ms | +0.10ms | +73.68% |
| mean | 0.10ms | 0.06ms | +0.04ms | +69.60% |
| min | 0.05ms | 0.04ms | +0.01ms | +14.02% |
| max | 0.24ms | 0.17ms | +0.08ms | +47.94% |
| total | 10.20ms | 6.01ms | +4.18ms | +69.60% |

