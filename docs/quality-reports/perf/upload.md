# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0022ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0019ms | 0.0051ms | 5ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +64% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0011ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | -43432 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27704 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -4312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0057ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0021ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | +1.0e-7ms | +0.00% |
| p50 | 0.0024ms | 0.0025ms | -0.00012ms | -4.88% |
| p95 | 0.0057ms | 0.0067ms | -0.0010ms | -15.57% |
| p99 | 0.01ms | 0.01ms | -0.0030ms | -22.17% |
| mean | 0.0031ms | 0.0033ms | -0.00020ms | -6.12% |
| min | 0.0021ms | 0.0020ms | +0.00013ms | +6.25% |
| max | 0.02ms | 0.02ms | -0.0038ms | -15.57% |
| total | 0.61ms | 0.65ms | -0.04ms | -6.12% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0051ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0037ms |
| min | 0.0019ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +0.000042ms | +2.24% |
| p50 | 0.0020ms | 0.0020ms | +0.000042ms | +2.15% |
| p95 | 0.0051ms | 0.0031ms | +0.0020ms | +64.40% |
| p99 | 0.02ms | 0.0075ms | +0.0075ms | +99.96% |
| mean | 0.0028ms | 0.0022ms | +0.00054ms | +23.97% |
| min | 0.0019ms | 0.0018ms | +0.000083ms | +4.63% |
| max | 0.04ms | 0.01ms | +0.03ms | +211.65% |
| total | 0.55ms | 0.45ms | +0.11ms | +23.97% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0016ms |
| p99 | 0.0064ms |
| mean | 0.0013ms |
| stdev | 0.0010ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0010ms | +0.000083ms | +8.30% |
| p50 | 0.0011ms | 0.0010ms | +0.000083ms | +7.97% |
| p95 | 0.0016ms | 0.0018ms | -0.00010ms | -5.94% |
| p99 | 0.0064ms | 0.0056ms | +0.00075ms | +13.25% |
| mean | 0.0013ms | 0.0013ms | +0.000067ms | +5.33% |
| min | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00042ms | -3.50% |
| total | 0.27ms | 0.25ms | +0.01ms | +5.33% |

