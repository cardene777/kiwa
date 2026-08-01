# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.0070ms | 0.02ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +162% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.11ms | 0.22ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | cpu | 0.09ms | 0.12ms | 0.0070ms | 0.076 | 0.072 | n/a | 20.0% | 0.0063ms | 0.0060ms |
| form_action_batch (5 invokeAction with FormData) | cpu | 0.09ms | 0.10ms | 0.11ms | 1.204 | 1.102 | n/a | 20.0% | 0.10ms | 0.09ms |
| load_error_handling (5 throw + catch) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.140 | 0.149 | n/a | 20.0% | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 1.15ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | -14456 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| form_action_batch (5 invokeAction with FormData) | 68160 B | -13702 B | 102400 B | yes | 23 (3 + 20) | PASS |
| load_error_handling (5 throw + catch) | -360 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0080ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0070ms |
| max | 0.07ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.905)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0060ms | +0.00034ms | +5.60% |
| p50 | 0.0072ms | 0.0064ms | +0.00085ms | +13.37% |
| p95 | 0.02ms | 0.0073ms | +0.01ms | +162.16% |
| p99 | 0.05ms | 0.0077ms | +0.04ms | +562.82% |
| mean | 0.01ms | 0.0065ms | +0.0050ms | +76.42% |
| min | 0.0063ms | 0.0060ms | +0.00030ms | +4.96% |
| max | 0.06ms | 0.0078ms | +0.05ms | +655.91% |
| total | 0.23ms | 0.13ms | +0.10ms | +76.42% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 0.22ms |
| p99 | 0.26ms |
| mean | 0.14ms |
| stdev | 0.04ms |
| min | 0.11ms |
| max | 0.27ms |
| total | 2.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0082ms | +9.26% |
| p50 | 0.11ms | 0.10ms | +0.0053ms | +5.23% |
| p95 | 0.19ms | 0.17ms | +0.02ms | +10.68% |
| p99 | 0.22ms | 0.22ms | +0.0050ms | +2.29% |
| mean | 0.12ms | 0.12ms | +0.0032ms | +2.74% |
| min | 0.10ms | 0.09ms | +0.0072ms | +8.22% |
| max | 0.23ms | 0.23ms | +0.0015ms | +0.68% |
| total | 2.37ms | 2.31ms | +0.06ms | +2.74% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00072ms | -5.97% |
| p50 | 0.01ms | 0.01ms | -0.0010ms | -8.14% |
| p95 | 0.02ms | 0.02ms | +0.00060ms | +3.86% |
| p99 | 0.02ms | 0.02ms | -0.00090ms | -4.84% |
| mean | 0.01ms | 0.01ms | -0.00084ms | -6.34% |
| min | 0.01ms | 0.01ms | -0.00039ms | -3.33% |
| max | 0.02ms | 0.02ms | -0.0013ms | -6.59% |
| total | 0.25ms | 0.26ms | -0.02ms | -6.34% |

