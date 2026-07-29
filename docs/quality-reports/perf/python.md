# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00046ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00038ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +67% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.02ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -135400 B | 0 B | 102400 B | yes | PASS |
| renderTemplate | -18152 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.0038ms |
| mean | 0.00061ms |
| stdev | 0.00055ms |
| min | 0.00042ms |
| max | 0.0052ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0011ms | 0.0018ms | -0.00071ms | -39.36% |
| p99 | 0.0038ms | 0.0063ms | -0.0025ms | -39.57% |
| mean | 0.00061ms | 0.00084ms | -0.00023ms | -27.01% |
| min | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| max | 0.0052ms | 0.0077ms | -0.0025ms | -32.80% |
| total | 0.12ms | 0.17ms | -0.05ms | -27.01% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.0010ms |
| p99 | 0.0049ms |
| mean | 0.00055ms |
| stdev | 0.00094ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00042ms | -0.000042ms | -10.07% |
| p95 | 0.0010ms | 0.00063ms | +0.00042ms | +66.90% |
| p99 | 0.0049ms | 0.0047ms | +0.00014ms | +2.90% |
| mean | 0.00055ms | 0.00054ms | +0.000012ms | +2.23% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.01ms | 0.0084ms | +0.0024ms | +28.85% |
| total | 0.11ms | 0.11ms | +0.0024ms | +2.23% |

### captureMiddlewareCall

# Perf Report — captureMiddlewareCall.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0023ms |
| mean | 0.00030ms |
| stdev | 0.00098ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00025ms | +0.0000020ms | +0.82% |
| p99 | 0.0023ms | 0.00097ms | +0.0014ms | +142.02% |
| mean | 0.00030ms | 0.00027ms | +0.000033ms | +12.46% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0077ms | +0.0058ms | +76.10% |
| total | 0.06ms | 0.05ms | +0.0067ms | +12.46% |

