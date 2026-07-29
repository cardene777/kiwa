# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00050ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00038ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00021ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +161%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.01ms | 10ms | PASS |
| renderTemplate | 0.02ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | 2344 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -3600 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 392 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0046ms |
| mean | 0.00063ms |
| stdev | 0.00060ms |
| min | 0.00046ms |
| max | 0.0061ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0011ms | 0.0018ms | -0.00071ms | -39.53% |
| p99 | 0.0046ms | 0.0063ms | -0.0017ms | -26.49% |
| mean | 0.00063ms | 0.00084ms | -0.00021ms | -24.85% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0061ms | 0.0077ms | -0.0017ms | -21.51% |
| total | 0.13ms | 0.17ms | -0.04ms | -24.85% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00054ms |
| p99 | 0.0044ms |
| mean | 0.00055ms |
| stdev | 0.00095ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00054ms | 0.00063ms | -0.000081ms | -12.95% |
| p99 | 0.0044ms | 0.0047ms | -0.00028ms | -5.94% |
| mean | 0.00055ms | 0.00054ms | +0.0000062ms | +1.15% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0084ms | +0.0034ms | +40.80% |
| total | 0.11ms | 0.11ms | +0.0012ms | +1.15% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00042ms |
| p95 | 0.00054ms |
| p99 | 0.0094ms |
| mean | 0.00065ms |
| stdev | 0.0023ms |
| min | 0.00017ms |
| max | 0.03ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00021ms | +0.00021ms | +100.00% |
| p95 | 0.00054ms | 0.00025ms | +0.00029ms | +117.64% |
| p99 | 0.0094ms | 0.00097ms | +0.0085ms | +875.64% |
| mean | 0.00065ms | 0.00027ms | +0.00038ms | +141.39% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.0077ms | +0.02ms | +244.59% |
| total | 0.13ms | 0.05ms | +0.08ms | +141.39% |

