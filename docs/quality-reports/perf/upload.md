# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| uploadFile | 0.0020ms | 0.04ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 -5% (閾値未満)、 p95 +145% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.0022ms | 0.0064ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyUpload | 0.0011ms | 0.0078ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| uploadFile | cpu | 0.09ms | 0.17ms | 0.0020ms | 0.023 | 0.024 | n/a | 20.0% | 0.0019ms | 0.0020ms |
| createPresignedUrl | cpu | 0.09ms | 0.09ms | 0.0022ms | 0.024 | 0.024 | n/a | 20.0% | 0.0020ms | 0.0020ms |
| verifyUpload | cpu | 0.09ms | 0.10ms | 0.0011ms | 0.013 | 0.013 | n/a | 20.0% | 0.0010ms | 0.0011ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.05ms | 10ms | PASS |
| createPresignedUrl | 0.05ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| uploadFile | 104032 B | 8192 B | 102400 B | yes | 220 (20 + 200) | PASS |
| createPresignedUrl | -8456 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| verifyUpload | 4992 B | -24576 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0030ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.0079ms |
| stdev | 0.01ms |
| min | 0.0019ms |
| max | 0.09ms |
| total | 1.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.928)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.00010ms | -5.23% |
| p50 | 0.0028ms | 0.0025ms | +0.00035ms | +14.08% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +145.13% |
| p99 | 0.06ms | 0.03ms | +0.03ms | +85.79% |
| mean | 0.0074ms | 0.0043ms | +0.0031ms | +71.92% |
| min | 0.0017ms | 0.0018ms | -0.000052ms | -2.88% |
| max | 0.09ms | 0.06ms | +0.03ms | +48.72% |
| total | 1.47ms | 0.86ms | +0.62ms | +71.92% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0064ms |
| p99 | 0.04ms |
| mean | 0.0036ms |
| stdev | 0.0068ms |
| min | 0.0020ms |
| max | 0.08ms |
| total | 0.72ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +4.7e-7ms | +0.02% |
| p50 | 0.0021ms | 0.0022ms | -0.00013ms | -5.92% |
| p95 | 0.0059ms | 0.02ms | -0.01ms | -69.84% |
| p99 | 0.04ms | 0.08ms | -0.04ms | -51.34% |
| mean | 0.0033ms | 0.03ms | -0.03ms | -88.89% |
| min | 0.0019ms | 0.0019ms | +0.000010ms | +0.53% |
| max | 0.07ms | 4.79ms | -4.72ms | -98.53% |
| total | 0.66ms | 5.96ms | -5.30ms | -88.89% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0013ms |
| p95 | 0.0078ms |
| p99 | 0.02ms |
| mean | 0.0026ms |
| stdev | 0.0055ms |
| min | 0.0010ms |
| max | 0.05ms |
| total | 0.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.919)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0011ms | -0.000049ms | -4.50% |
| p50 | 0.0011ms | 0.0012ms | -0.000060ms | -4.95% |
| p95 | 0.0072ms | 0.02ms | -0.0081ms | -52.98% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -47.44% |
| mean | 0.0024ms | 0.0037ms | -0.0013ms | -35.40% |
| min | 0.00096ms | 0.0010ms | -0.000042ms | -4.20% |
| max | 0.04ms | 0.09ms | -0.05ms | -51.07% |
| total | 0.47ms | 0.73ms | -0.26ms | -35.40% |

