# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00046ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00038ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.01ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -12496 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -19576 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0040ms |
| mean | 0.00066ms |
| stdev | 0.00085ms |
| min | 0.00046ms |
| max | 0.0083ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0011ms | 0.0018ms | -0.00067ms | -37.19% |
| p99 | 0.0040ms | 0.0063ms | -0.0023ms | -35.82% |
| mean | 0.00066ms | 0.00084ms | -0.00018ms | -20.96% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0083ms | 0.0077ms | +0.00058ms | +7.52% |
| total | 0.13ms | 0.17ms | -0.04ms | -20.96% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00059ms |
| p99 | 0.0054ms |
| mean | 0.00056ms |
| stdev | 0.0010ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.00059ms | 0.00063ms | -0.000032ms | -5.05% |
| p99 | 0.0054ms | 0.0047ms | +0.00067ms | +14.20% |
| mean | 0.00056ms | 0.00054ms | +0.000014ms | +2.64% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.01ms | 0.0084ms | +0.0045ms | +54.23% |
| total | 0.11ms | 0.11ms | +0.0029ms | +2.64% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0016ms |
| mean | 0.00026ms |
| stdev | 0.00043ms |
| min | 0.00017ms |
| max | 0.0053ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00025ms | +0.0000020ms | +0.82% |
| p99 | 0.0016ms | 0.00097ms | +0.00063ms | +64.95% |
| mean | 0.00026ms | 0.00027ms | -0.0000047ms | -1.77% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0053ms | 0.0077ms | -0.0024ms | -30.97% |
| total | 0.05ms | 0.05ms | -0.00095ms | -1.77% |

