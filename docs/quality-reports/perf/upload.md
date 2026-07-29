# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0018ms | 0.0066ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0018ms | 0.0033ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0010ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.05ms | 10ms | PASS |
| createPresignedUrl | 0.08ms | 10ms | PASS |
| verifyUpload | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | -42816 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27968 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -4552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0066ms |
| p99 | 0.01ms |
| mean | 0.0029ms |
| stdev | 0.0022ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0022ms | -0.00045ms | -20.25% |
| p50 | 0.0020ms | 0.0025ms | -0.00052ms | -20.48% |
| p95 | 0.0066ms | 0.0067ms | -0.00012ms | -1.75% |
| p99 | 0.01ms | 0.01ms | -0.00049ms | -3.59% |
| mean | 0.0029ms | 0.0033ms | -0.00035ms | -10.66% |
| min | 0.0016ms | 0.0020ms | -0.00038ms | -18.75% |
| max | 0.02ms | 0.02ms | -0.0055ms | -22.16% |
| total | 0.58ms | 0.65ms | -0.07ms | -10.66% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0033ms |
| p99 | 0.0079ms |
| mean | 0.0022ms |
| stdev | 0.0012ms |
| min | 0.0017ms |
| max | 0.01ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0019ms | -0.00012ms | -6.67% |
| p50 | 0.0018ms | 0.0020ms | -0.00013ms | -6.38% |
| p95 | 0.0033ms | 0.0031ms | +0.00021ms | +6.75% |
| p99 | 0.0079ms | 0.0075ms | +0.00033ms | +4.42% |
| mean | 0.0022ms | 0.0022ms | -0.000054ms | -2.42% |
| min | 0.0017ms | 0.0018ms | -0.000084ms | -4.69% |
| max | 0.01ms | 0.01ms | -0.00075ms | -5.37% |
| total | 0.44ms | 0.45ms | -0.01ms | -2.42% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0015ms |
| p99 | 0.0069ms |
| mean | 0.0012ms |
| stdev | 0.00099ms |
| min | 0.00096ms |
| max | 0.0092ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.0018ms | -0.00021ms | -11.81% |
| p99 | 0.0069ms | 0.0056ms | +0.0013ms | +23.02% |
| mean | 0.0012ms | 0.0013ms | -0.000018ms | -1.47% |
| min | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| max | 0.0092ms | 0.01ms | -0.0027ms | -22.38% |
| total | 0.25ms | 0.25ms | -0.0037ms | -1.47% |

