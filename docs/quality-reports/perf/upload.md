# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0020ms | 0.02ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 -9% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0021ms | 0.01ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0012ms | 0.0085ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| uploadFile | cpu | 0.09ms | 0.10ms | 0.0020ms | 0.022 | 0.024 | 0.0018ms | 0.0020ms |
| createPresignedUrl | cpu | 0.09ms | 0.10ms | 0.0021ms | 0.024 | 0.024 | 0.0019ms | 0.0020ms |
| verifyUpload | cpu | 0.09ms | 0.10ms | 0.0012ms | 0.013 | 0.013 | 0.0011ms | 0.0011ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.06ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 75648 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27936 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -4264 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0024ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0050ms |
| stdev | 0.0073ms |
| min | 0.0018ms |
| max | 0.06ms |
| total | 0.99ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.934)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00017ms | -8.53% |
| p50 | 0.0022ms | 0.0025ms | -0.00024ms | -9.77% |
| p95 | 0.02ms | 0.01ms | +0.0064ms | +45.31% |
| p99 | 0.03ms | 0.03ms | -0.0042ms | -12.20% |
| mean | 0.0046ms | 0.0043ms | +0.00035ms | +8.27% |
| min | 0.0017ms | 0.0018ms | -0.000079ms | -4.42% |
| max | 0.05ms | 0.06ms | -0.0033ms | -5.73% |
| total | 0.93ms | 0.86ms | +0.07ms | +8.27% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0023ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0045ms |
| stdev | 0.0092ms |
| min | 0.0020ms |
| max | 0.10ms |
| total | 0.89ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000057ms | -2.87% |
| p50 | 0.0021ms | 0.0022ms | -0.00012ms | -5.21% |
| p95 | 0.01ms | 0.02ms | -0.0063ms | -32.19% |
| p99 | 0.04ms | 0.08ms | -0.04ms | -50.04% |
| mean | 0.0041ms | 0.03ms | -0.03ms | -86.28% |
| min | 0.0019ms | 0.0019ms | -0.0000083ms | -0.44% |
| max | 0.10ms | 4.79ms | -4.70ms | -98.00% |
| total | 0.82ms | 5.96ms | -5.15ms | -86.28% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0085ms |
| p99 | 0.03ms |
| mean | 0.0025ms |
| stdev | 0.0047ms |
| min | 0.0010ms |
| max | 0.04ms |
| total | 0.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | -0.0000047ms | -0.43% |
| p50 | 0.0012ms | 0.0012ms | -0.000015ms | -1.25% |
| p95 | 0.0079ms | 0.02ms | -0.0074ms | -48.64% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -29.39% |
| mean | 0.0023ms | 0.0037ms | -0.0014ms | -37.13% |
| min | 0.00096ms | 0.0010ms | -0.000038ms | -3.80% |
| max | 0.03ms | 0.09ms | -0.06ms | -62.42% |
| total | 0.46ms | 0.73ms | -0.27ms | -37.13% |

