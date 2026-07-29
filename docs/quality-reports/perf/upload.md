# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0018ms | 0.0066ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0018ms | 0.0031ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0010ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 76712 B | -38755 B | 102400 B | yes | PASS |
| createPresignedUrl | -26672 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | 230728 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.0028ms |
| stdev | 0.0025ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0022ms | -0.00041ms | -18.38% |
| p50 | 0.0020ms | 0.0025ms | -0.00050ms | -19.68% |
| p95 | 0.0066ms | 0.0067ms | -0.00014ms | -2.06% |
| p99 | 0.01ms | 0.01ms | -0.0013ms | -9.18% |
| mean | 0.0028ms | 0.0033ms | -0.00043ms | -13.21% |
| min | 0.0017ms | 0.0020ms | -0.00033ms | -16.65% |
| max | 0.02ms | 0.02ms | -0.0016ms | -6.60% |
| total | 0.57ms | 0.65ms | -0.09ms | -13.21% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0031ms |
| p99 | 0.0079ms |
| mean | 0.0022ms |
| stdev | 0.0015ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0019ms | -0.00012ms | -6.67% |
| p50 | 0.0018ms | 0.0020ms | -0.00013ms | -6.38% |
| p95 | 0.0031ms | 0.0031ms | +0.000051ms | +1.66% |
| p99 | 0.0079ms | 0.0075ms | +0.00034ms | +4.50% |
| mean | 0.0022ms | 0.0022ms | -0.000060ms | -2.69% |
| min | 0.0018ms | 0.0018ms | -0.000042ms | -2.34% |
| max | 0.02ms | 0.01ms | +0.0017ms | +12.24% |
| total | 0.44ms | 0.45ms | -0.01ms | -2.69% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0025ms |
| p99 | 0.0069ms |
| mean | 0.0017ms |
| stdev | 0.0064ms |
| min | 0.00096ms |
| max | 0.09ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0025ms | 0.0018ms | +0.00072ms | +40.94% |
| p99 | 0.0069ms | 0.0056ms | +0.0013ms | +22.77% |
| mean | 0.0017ms | 0.0013ms | +0.00045ms | +36.15% |
| min | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| max | 0.09ms | 0.01ms | +0.08ms | +664.32% |
| total | 0.34ms | 0.25ms | +0.09ms | +36.15% |

