# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0018ms | 0.0065ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0018ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.00096ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.03ms | 10ms | PASS |
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 76992 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27120 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -4312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0065ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0024ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0022ms | -0.00050ms | -22.08% |
| p50 | 0.0020ms | 0.0025ms | -0.00054ms | -21.29% |
| p95 | 0.0065ms | 0.0067ms | -0.00022ms | -3.26% |
| p99 | 0.02ms | 0.01ms | +0.0031ms | +22.63% |
| mean | 0.0028ms | 0.0033ms | -0.00049ms | -14.91% |
| min | 0.0016ms | 0.0020ms | -0.00038ms | -18.75% |
| max | 0.02ms | 0.02ms | -0.0051ms | -20.81% |
| total | 0.55ms | 0.65ms | -0.10ms | -14.91% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0034ms |
| p99 | 0.0090ms |
| mean | 0.0022ms |
| stdev | 0.0015ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0019ms | -0.000083ms | -4.43% |
| p50 | 0.0019ms | 0.0020ms | -0.000083ms | -4.24% |
| p95 | 0.0034ms | 0.0031ms | +0.00033ms | +10.75% |
| p99 | 0.0090ms | 0.0075ms | +0.0015ms | +19.61% |
| mean | 0.0022ms | 0.0022ms | +0.0000048ms | +0.22% |
| min | 0.0018ms | 0.0018ms | -0.000042ms | -2.34% |
| max | 0.02ms | 0.01ms | +0.0013ms | +9.56% |
| total | 0.45ms | 0.45ms | +0.00097ms | +0.22% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0020ms |
| p99 | 0.0069ms |
| mean | 0.0012ms |
| stdev | 0.0011ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0010ms | -0.000041ms | -4.10% |
| p50 | 0.0010ms | 0.0010ms | -0.000042ms | -4.03% |
| p95 | 0.0020ms | 0.0018ms | +0.00022ms | +12.35% |
| p99 | 0.0069ms | 0.0056ms | +0.0012ms | +22.07% |
| mean | 0.0012ms | 0.0013ms | -0.000017ms | -1.34% |
| min | 0.00092ms | 0.0010ms | -0.000084ms | -8.40% |
| max | 0.01ms | 0.01ms | +0.00054ms | +4.54% |
| total | 0.25ms | 0.25ms | -0.0034ms | -1.34% |

