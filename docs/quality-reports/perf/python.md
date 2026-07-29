# Perf Suite — python

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dispatchRequest | 0.00050ms | 0.0017ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +167%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderTemplate | 0.00054ms | 0.0012ms | 5ms | 0.00083ms | PASS | stable (差 0.00017ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureMiddlewareCall | 0.00021ms | 0.00029ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +401%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRequest | 0.02ms | 10ms | PASS |
| renderTemplate | 0.01ms | 10ms | PASS |
| captureMiddlewareCall | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRequest | -3592 B | -46779 B | 102400 B | yes | PASS |
| renderTemplate | -16992 B | 0 B | 102400 B | yes | PASS |
| captureMiddlewareCall | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRequest

# Perf Report — dispatchRequest.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0017ms |
| p99 | 0.0084ms |
| mean | 0.0011ms |
| stdev | 0.0041ms |
| min | 0.00046ms |
| max | 0.05ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0017ms | 0.0018ms | -0.000090ms | -5.00% |
| p99 | 0.0084ms | 0.0063ms | +0.0021ms | +32.84% |
| mean | 0.0011ms | 0.00084ms | +0.00026ms | +30.66% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.0077ms | +0.05ms | +603.75% |
| total | 0.22ms | 0.17ms | +0.05ms | +30.66% |

### renderTemplate

# Perf Report — renderTemplate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0012ms |
| p99 | 0.0056ms |
| mean | 0.00071ms |
| stdev | 0.00093ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00038ms | +0.00017ms | +44.27% |
| p50 | 0.00054ms | 0.00042ms | +0.00012ms | +29.98% |
| p95 | 0.0012ms | 0.00063ms | +0.00054ms | +86.90% |
| p99 | 0.0056ms | 0.0047ms | +0.00093ms | +19.65% |
| mean | 0.00071ms | 0.00054ms | +0.00017ms | +30.93% |
| min | 0.00050ms | 0.00038ms | +0.00013ms | +33.33% |
| max | 0.01ms | 0.0084ms | +0.0020ms | +24.37% |
| total | 0.14ms | 0.11ms | +0.03ms | +30.93% |

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
| mean | 0.00033ms |
| stdev | 0.00092ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00029ms | 0.00025ms | +0.000042ms | +16.80% |
| p99 | 0.0018ms | 0.00097ms | +0.00082ms | +85.06% |
| mean | 0.00033ms | 0.00027ms | +0.000060ms | +22.40% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.01ms | 0.0077ms | +0.0053ms | +69.58% |
| total | 0.07ms | 0.05ms | +0.01ms | +22.40% |

