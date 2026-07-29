# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0018ms | 0.0061ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0018ms | 0.0033ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0010ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | -48488 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -26672 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -4856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0061ms |
| p99 | 0.01ms |
| mean | 0.0026ms |
| stdev | 0.0020ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0022ms | -0.00045ms | -20.21% |
| p50 | 0.0020ms | 0.0025ms | -0.00058ms | -22.94% |
| p95 | 0.0061ms | 0.0067ms | -0.00067ms | -9.95% |
| p99 | 0.01ms | 0.01ms | -0.0014ms | -10.27% |
| mean | 0.0026ms | 0.0033ms | -0.00061ms | -18.77% |
| min | 0.0017ms | 0.0020ms | -0.00033ms | -16.65% |
| max | 0.02ms | 0.02ms | -0.0056ms | -22.67% |
| total | 0.53ms | 0.65ms | -0.12ms | -18.77% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0033ms |
| p99 | 0.0088ms |
| mean | 0.0022ms |
| stdev | 0.0014ms |
| min | 0.0017ms |
| max | 0.01ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0019ms | -0.000088ms | -4.70% |
| p50 | 0.0018ms | 0.0020ms | -0.00012ms | -6.33% |
| p95 | 0.0033ms | 0.0031ms | +0.00025ms | +8.11% |
| p99 | 0.0088ms | 0.0075ms | +0.0013ms | +16.86% |
| mean | 0.0022ms | 0.0022ms | -0.000027ms | -1.20% |
| min | 0.0017ms | 0.0018ms | -0.000084ms | -4.69% |
| max | 0.01ms | 0.01ms | +0.00075ms | +5.38% |
| total | 0.44ms | 0.45ms | -0.0054ms | -1.20% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0020ms |
| p99 | 0.0069ms |
| mean | 0.0013ms |
| stdev | 0.0016ms |
| min | 0.00092ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0020ms | 0.0018ms | +0.00021ms | +11.99% |
| p99 | 0.0069ms | 0.0056ms | +0.0013ms | +22.45% |
| mean | 0.0013ms | 0.0013ms | +0.000061ms | +4.82% |
| min | 0.00092ms | 0.0010ms | -0.000084ms | -8.40% |
| max | 0.02ms | 0.01ms | +0.0086ms | +72.38% |
| total | 0.26ms | 0.25ms | +0.01ms | +4.82% |

