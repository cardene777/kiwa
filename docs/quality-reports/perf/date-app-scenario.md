# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0034ms | 0.0091ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0064ms | 0.01ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +60% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | cpu | 0.09ms | 0.10ms | 0.0034ms | 0.036 | 0.037 | n/a | 20.0% | 0.0030ms | 0.0031ms |
| format_parse_batch (5 format + parse round-trip) | cpu | 0.09ms | 0.09ms | 0.0064ms | 0.072 | 0.072 | n/a | 20.0% | 0.0059ms | 0.0059ms |
| parse_error_handling (5 invalid string throw + catch) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.175 | 0.181 | n/a | 20.0% | 0.01ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | -6128 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| format_parse_batch (5 format + parse round-trip) | -2464 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| parse_error_handling (5 invalid string throw + catch) | -696 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0037ms |
| p95 | 0.0091ms |
| p99 | 0.0094ms |
| mean | 0.0050ms |
| stdev | 0.0020ms |
| min | 0.0033ms |
| max | 0.0095ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0031ms | -0.000074ms | -2.36% |
| p50 | 0.0033ms | 0.0032ms | +0.00011ms | +3.42% |
| p95 | 0.0083ms | 0.0087ms | -0.00048ms | -5.43% |
| p99 | 0.0085ms | 0.0094ms | -0.00088ms | -9.37% |
| mean | 0.0045ms | 0.0044ms | +0.00012ms | +2.74% |
| min | 0.0030ms | 0.0030ms | -0.000020ms | -0.68% |
| max | 0.0086ms | 0.0095ms | -0.00098ms | -10.28% |
| total | 0.09ms | 0.09ms | +0.0024ms | +2.74% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0064ms |
| p50 | 0.0065ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0073ms |
| stdev | 0.0021ms |
| min | 0.0063ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0059ms | -0.0000023ms | -0.04% |
| p50 | 0.0060ms | 0.0061ms | -0.00013ms | -2.19% |
| p95 | 0.01ms | 0.0077ms | +0.0046ms | +59.51% |
| p99 | 0.01ms | 0.01ms | +0.00094ms | +8.30% |
| mean | 0.0067ms | 0.0065ms | +0.00015ms | +2.29% |
| min | 0.0058ms | 0.0057ms | +0.000050ms | +0.86% |
| max | 0.01ms | 0.01ms | +0.000037ms | +0.30% |
| total | 0.13ms | 0.13ms | +0.0030ms | +2.29% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0020ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.891)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00056ms | -3.73% |
| p50 | 0.01ms | 0.02ms | -0.00059ms | -3.83% |
| p95 | 0.02ms | 0.02ms | -0.0016ms | -8.77% |
| p99 | 0.02ms | 0.02ms | -0.0020ms | -8.51% |
| mean | 0.02ms | 0.02ms | -0.00072ms | -4.52% |
| min | 0.01ms | 0.01ms | -0.00044ms | -2.95% |
| max | 0.02ms | 0.02ms | -0.0021ms | -8.46% |
| total | 0.30ms | 0.32ms | -0.01ms | -4.52% |

