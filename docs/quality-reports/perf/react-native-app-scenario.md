# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0087ms | 0.05ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +181% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0021ms | 0.0042ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.02ms | 0.02ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | cpu | 0.09ms | 0.14ms | 0.0087ms | 0.096 | 0.092 | n/a | 20.0% | 0.0079ms | 0.0076ms |
| multi_platform_batch (5 iOS+Android+web env switch) | cpu | 0.09ms | 0.09ms | 0.0021ms | 0.023 | 0.024 | n/a | 20.0% | 0.0019ms | 0.0020ms |
| linking_error_handling (5 invalid url + listener cleanup) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.180 | 0.173 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.05ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.02ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | -15208 B | -11842 B | 102400 B | yes | 23 (3 + 20) | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 1600 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 648 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0087ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.0084ms |
| max | 0.06ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0076ms | +0.00035ms | +4.59% |
| p50 | 0.02ms | 0.0090ms | +0.01ms | +146.57% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +181.49% |
| p99 | 0.05ms | 0.01ms | +0.03ms | +233.80% |
| mean | 0.02ms | 0.0093ms | +0.01ms | +156.79% |
| min | 0.0076ms | 0.0074ms | +0.00022ms | +2.95% |
| max | 0.05ms | 0.01ms | +0.04ms | +246.74% |
| total | 0.48ms | 0.19ms | +0.29ms | +156.79% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0031ms |
| p95 | 0.0042ms |
| p99 | 0.0042ms |
| mean | 0.0030ms |
| stdev | 0.00064ms |
| min | 0.0021ms |
| max | 0.0043ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000074ms | -3.68% |
| p50 | 0.0028ms | 0.0021ms | +0.00075ms | +35.88% |
| p95 | 0.0039ms | 0.0031ms | +0.00081ms | +26.29% |
| p99 | 0.0039ms | 0.0037ms | +0.00024ms | +6.48% |
| mean | 0.0027ms | 0.0023ms | +0.00048ms | +21.50% |
| min | 0.0019ms | 0.0020ms | -0.000032ms | -1.66% |
| max | 0.0039ms | 0.0038ms | +0.000096ms | +2.50% |
| total | 0.05ms | 0.05ms | +0.0097ms | +21.50% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0010ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00055ms | +3.83% |
| p50 | 0.02ms | 0.01ms | +0.00055ms | +3.76% |
| p95 | 0.02ms | 0.08ms | -0.07ms | -80.44% |
| p99 | 0.02ms | 0.12ms | -0.10ms | -84.17% |
| mean | 0.02ms | 0.02ms | -0.0084ms | -35.23% |
| min | 0.01ms | 0.01ms | +0.00051ms | +3.62% |
| max | 0.02ms | 0.13ms | -0.11ms | -84.79% |
| total | 0.31ms | 0.48ms | -0.17ms | -35.23% |

