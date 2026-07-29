# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0018ms | 0.0084ms | 5ms | 0.00033ms | PASS | stable (p10 -18% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0019ms | 0.0035ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0011ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.03ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 78184 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27888 B | 8192 B | 102400 B | yes | PASS |
| verifyUpload | -4408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0021ms |
| p95 | 0.0084ms |
| p99 | 0.02ms |
| mean | 0.0032ms |
| stdev | 0.0043ms |
| min | 0.0018ms |
| max | 0.05ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0022ms | -0.00041ms | -18.38% |
| p50 | 0.0021ms | 0.0025ms | -0.00046ms | -18.02% |
| p95 | 0.0084ms | 0.0067ms | +0.0017ms | +24.88% |
| p99 | 0.02ms | 0.01ms | +0.0017ms | +12.61% |
| mean | 0.0032ms | 0.0033ms | -0.000019ms | -0.57% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.50% |
| max | 0.05ms | 0.02ms | +0.03ms | +110.49% |
| total | 0.65ms | 0.65ms | -0.0037ms | -0.57% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0035ms |
| p99 | 0.0083ms |
| mean | 0.0023ms |
| stdev | 0.0014ms |
| min | 0.0018ms |
| max | 0.01ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | 0.00ms | 0.00% |
| p50 | 0.0020ms | 0.0020ms | 0.00ms | 0.00% |
| p95 | 0.0035ms | 0.0031ms | +0.00040ms | +12.91% |
| p99 | 0.0083ms | 0.0075ms | +0.00076ms | +10.02% |
| mean | 0.0023ms | 0.0022ms | +0.000072ms | +3.20% |
| min | 0.0018ms | 0.0018ms | +0.000041ms | +2.29% |
| max | 0.01ms | 0.01ms | +0.00042ms | +2.99% |
| total | 0.46ms | 0.45ms | +0.01ms | +3.20% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0016ms |
| p99 | 0.0083ms |
| mean | 0.0013ms |
| stdev | 0.0010ms |
| min | 0.0011ms |
| max | 0.010ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0010ms | +0.00012ms | +12.09% |
| p50 | 0.0012ms | 0.0010ms | +0.00012ms | +11.90% |
| p95 | 0.0016ms | 0.0018ms | -0.00011ms | -6.54% |
| p99 | 0.0083ms | 0.0056ms | +0.0027ms | +47.05% |
| mean | 0.0013ms | 0.0013ms | +0.000091ms | +7.25% |
| min | 0.0011ms | 0.0010ms | +0.000083ms | +8.30% |
| max | 0.010ms | 0.01ms | -0.0020ms | -16.44% |
| total | 0.27ms | 0.25ms | +0.02ms | +7.25% |

