# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0018ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0019ms | 0.0056ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0010ms | 0.0048ms | 5ms | 0.00033ms | PASS | stable (p10 -1% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| uploadFile | cpu | 0.08ms | 0.0018ms | 0.022 | 0.023 | 0.0018ms | 0.0019ms |
| createPresignedUrl | cpu | 0.08ms | 0.0019ms | 0.023 | 0.023 | 0.0019ms | 0.0018ms |
| verifyUpload | cpu | 0.08ms | 0.0010ms | 0.012 | 0.012 | 0.00099ms | 0.0010ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 71408 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27784 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -4728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0022ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.0045ms |
| min | 0.0016ms |
| max | 0.03ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0019ms | -0.000083ms | -4.43% |
| p50 | 0.0022ms | 0.0023ms | -0.000084ms | -3.64% |
| p95 | 0.01ms | 0.02ms | -0.0071ms | -33.42% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -41.37% |
| mean | 0.0038ms | 0.0054ms | -0.0015ms | -28.80% |
| min | 0.0016ms | 0.0017ms | -0.000083ms | -4.86% |
| max | 0.03ms | 0.08ms | -0.05ms | -58.05% |
| total | 0.76ms | 1.07ms | -0.31ms | -28.80% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0056ms |
| p99 | 0.02ms |
| mean | 0.0029ms |
| stdev | 0.0039ms |
| min | 0.0018ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0018ms | +0.000042ms | +2.29% |
| p50 | 0.0020ms | 0.0020ms | 0.00ms | 0.00% |
| p95 | 0.0056ms | 0.01ms | -0.0047ms | -45.99% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -50.44% |
| mean | 0.0029ms | 0.0036ms | -0.00078ms | -21.37% |
| min | 0.0018ms | 0.0018ms | +0.000083ms | +4.74% |
| max | 0.04ms | 0.05ms | -0.02ms | -29.43% |
| total | 0.57ms | 0.73ms | -0.16ms | -21.37% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0048ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0028ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0011ms | 0.0012ms | -0.000041ms | -3.52% |
| p95 | 0.0048ms | 0.0039ms | +0.00089ms | +22.97% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +11.58% |
| mean | 0.0018ms | 0.0019ms | -0.00013ms | -6.66% |
| min | 0.00096ms | 0.00096ms | +0.0000010ms | +0.10% |
| max | 0.02ms | 0.03ms | -0.0082ms | -25.00% |
| total | 0.36ms | 0.38ms | -0.03ms | -6.66% |

