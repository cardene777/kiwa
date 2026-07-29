# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0021ms | 0.0073ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0022ms | 0.0039ms | 5ms | 0.00042ms | PASS | stable (p10 +16% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0011ms | 0.0021ms | 5ms | 0.00042ms | PASS | stable (p10 +12% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 77936 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -26672 B | 8192 B | 102400 B | yes | PASS |
| verifyUpload | -4408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0023ms |
| p95 | 0.0073ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0025ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.00016ms | -7.21% |
| p50 | 0.0023ms | 0.0025ms | -0.00023ms | -8.99% |
| p95 | 0.0073ms | 0.0067ms | +0.00057ms | +8.45% |
| p99 | 0.01ms | 0.01ms | -0.0020ms | -14.61% |
| mean | 0.0031ms | 0.0033ms | -0.00016ms | -4.83% |
| min | 0.0020ms | 0.0020ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.00025ms | -1.02% |
| total | 0.62ms | 0.65ms | -0.03ms | -4.83% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0039ms |
| p99 | 0.0094ms |
| mean | 0.0026ms |
| stdev | 0.0015ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0019ms | +0.00029ms | +15.57% |
| p50 | 0.0022ms | 0.0020ms | +0.00029ms | +14.91% |
| p95 | 0.0039ms | 0.0031ms | +0.00079ms | +25.60% |
| p99 | 0.0094ms | 0.0075ms | +0.0019ms | +24.83% |
| mean | 0.0026ms | 0.0022ms | +0.00041ms | +18.35% |
| min | 0.0021ms | 0.0018ms | +0.00033ms | +18.58% |
| max | 0.02ms | 0.01ms | +0.0025ms | +18.21% |
| total | 0.53ms | 0.45ms | +0.08ms | +18.35% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0021ms |
| p99 | 0.0078ms |
| mean | 0.0015ms |
| stdev | 0.0012ms |
| min | 0.0011ms |
| max | 0.01ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0010ms | +0.00012ms | +12.50% |
| p50 | 0.0012ms | 0.0010ms | +0.00017ms | +15.93% |
| p95 | 0.0021ms | 0.0018ms | +0.00035ms | +20.08% |
| p99 | 0.0078ms | 0.0056ms | +0.0021ms | +37.84% |
| mean | 0.0015ms | 0.0013ms | +0.00020ms | +15.78% |
| min | 0.0011ms | 0.0010ms | +0.00012ms | +12.50% |
| max | 0.01ms | 0.01ms | -0.00021ms | -1.75% |
| total | 0.29ms | 0.25ms | +0.04ms | +15.78% |

