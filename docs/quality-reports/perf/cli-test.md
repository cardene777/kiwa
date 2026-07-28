# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| writeFile | 0.34ms | 20ms | PASS | improved — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |
| readFile | 0.25ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +239%) 以上の悪化が必要) — gate 対象外 (fs syscall の揺らぎが実行ごとに p50 で 200% 超動く (#1718)) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 1.12ms | 40ms | PASS |
| readFile | 0.24ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 1776 B | 18856 B | 102400 B | yes | PASS |
| readFile | -10560 B | -98759 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.34ms |
| p99 | 0.53ms |
| mean | 0.17ms |
| stdev | 0.09ms |
| min | 0.09ms |
| max | 0.63ms |
| total | 16.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.34ms | -0.21ms | -62.04% |
| p95 | 0.34ms | 0.93ms | -0.59ms | -63.86% |
| p99 | 0.53ms | 1.70ms | -1.17ms | -68.65% |
| mean | 0.17ms | 0.47ms | -0.31ms | -64.89% |
| min | 0.09ms | 0.12ms | -0.03ms | -22.48% |
| max | 0.63ms | 10.31ms | -9.68ms | -93.88% |
| total | 16.55ms | 82.96ms | -66.41ms | -80.05% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.25ms |
| p99 | 0.29ms |
| mean | 0.08ms |
| stdev | 0.06ms |
| min | 0.04ms |
| max | 0.32ms |
| total | 8.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.13ms | -0.08ms | -60.43% |
| p95 | 0.25ms | 0.21ms | +0.04ms | +17.74% |
| p99 | 0.29ms | 0.25ms | +0.04ms | +16.76% |
| mean | 0.08ms | 0.14ms | -0.05ms | -38.98% |
| min | 0.04ms | 0.08ms | -0.04ms | -47.78% |
| max | 0.32ms | 0.27ms | +0.05ms | +17.35% |
| total | 8.33ms | 24.02ms | -15.69ms | -65.33% |

