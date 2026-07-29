# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00050ms | 0.0012ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00038ms | 0.0013ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +111%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00021ms | 0.00029ms | 5ms | 0.00042ms | PASS | stable (検知には +0.00042ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.02ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -9256 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -18248 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | -512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0041ms |
| mean | 0.00068ms |
| stdev | 0.00073ms |
| min | 0.00046ms |
| max | 0.0069ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | -5.0e-7ms | -0.09% |
| p95 | 0.0012ms | 0.0018ms | -0.00062ms | -34.73% |
| p99 | 0.0041ms | 0.0063ms | -0.0022ms | -34.68% |
| mean | 0.00068ms | 0.00084ms | -0.00016ms | -18.89% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0069ms | 0.0077ms | -0.00083ms | -10.75% |
| total | 0.14ms | 0.17ms | -0.03ms | -18.89% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0061ms |
| mean | 0.00063ms |
| stdev | 0.0012ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.00063ms | +0.00063ms | +100.00% |
| p99 | 0.0061ms | 0.0047ms | +0.0013ms | +28.46% |
| mean | 0.00063ms | 0.00054ms | +0.000091ms | +16.78% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0084ms | +0.0054ms | +64.18% |
| total | 0.13ms | 0.11ms | +0.02ms | +16.78% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0018ms |
| mean | 0.00030ms |
| stdev | 0.00054ms |
| min | 0.00017ms |
| max | 0.0071ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00029ms | 0.00025ms | +0.000042ms | +16.80% |
| p99 | 0.0018ms | 0.00097ms | +0.00083ms | +86.11% |
| mean | 0.00030ms | 0.00027ms | +0.000032ms | +11.91% |
| min | 0.00017ms | 0.00017ms | +0.0000010ms | +0.60% |
| max | 0.0071ms | 0.0077ms | -0.00054ms | -7.06% |
| total | 0.06ms | 0.05ms | +0.0064ms | +11.91% |

