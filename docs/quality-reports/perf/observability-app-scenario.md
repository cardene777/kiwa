# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.06ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.07ms | 100ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.05ms | 0.05ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | cpu | 0.08ms | 0.10ms | 0.03ms | 0.415 | 0.423 | n/a | 20.0% | 0.03ms | 0.03ms |
| large_history_detect (200 test × 5 run) | cpu | 0.08ms | 0.09ms | 0.06ms | 0.670 | 0.687 | n/a | 20.0% | 0.05ms | 0.05ms |
| threshold_varying_workload (10 different threshold) | cpu | 0.08ms | 0.09ms | 0.05ms | 0.547 | 0.515 | n/a | 20.0% | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.15ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.32ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.30ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -10400 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| large_history_detect (200 test × 5 run) | 6248 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |
| threshold_varying_workload (10 different threshold) | 720 B | 0 B | 102400 B | yes | 33 (3 + 30) | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.975)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00068ms | -2.00% |
| p50 | 0.04ms | 0.04ms | -0.0036ms | -9.23% |
| p95 | 0.06ms | 0.07ms | -0.0059ms | -8.81% |
| p99 | 0.08ms | 0.08ms | -0.00067ms | -0.87% |
| mean | 0.04ms | 0.04ms | -0.0024ms | -5.60% |
| min | 0.03ms | 0.03ms | -0.00066ms | -1.99% |
| max | 0.08ms | 0.08ms | +0.0037ms | +4.69% |
| total | 1.19ms | 1.26ms | -0.07ms | -5.60% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.0036ms |
| min | 0.06ms |
| max | 0.07ms |
| total | 1.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0014ms | -2.51% |
| p50 | 0.05ms | 0.06ms | -0.0095ms | -14.86% |
| p95 | 0.06ms | 0.12ms | -0.06ms | -48.43% |
| p99 | 0.06ms | 0.20ms | -0.14ms | -68.39% |
| mean | 0.06ms | 0.07ms | -0.02ms | -24.07% |
| min | 0.05ms | 0.05ms | -0.0013ms | -2.39% |
| max | 0.06ms | 0.23ms | -0.17ms | -72.35% |
| total | 1.69ms | 2.22ms | -0.54ms | -24.07% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0033ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0025ms | +6.18% |
| p50 | 0.04ms | 0.04ms | +0.0020ms | +4.81% |
| p95 | 0.05ms | 0.05ms | -0.00096ms | -1.89% |
| p99 | 0.06ms | 0.05ms | +0.0063ms | +12.39% |
| mean | 0.05ms | 0.04ms | +0.0015ms | +3.32% |
| min | 0.04ms | 0.04ms | +0.0030ms | +7.39% |
| max | 0.06ms | 0.05ms | +0.0083ms | +16.10% |
| total | 1.36ms | 1.31ms | +0.04ms | +3.32% |

