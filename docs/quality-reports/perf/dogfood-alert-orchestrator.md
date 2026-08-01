# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0019ms | 0.0056ms | 30ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.00088ms | 0.0067ms | 20ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0011ms | 0.0050ms | 20ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| evaluateRules | cpu | 0.09ms | 0.09ms | 0.0019ms | 0.021 | 0.023 | n/a | 20.0% | 0.0017ms | 0.0019ms |
| routeAlert | cpu | 0.09ms | 0.09ms | 0.00088ms | 0.010 | 0.010 | n/a | 20.0% | 0.00081ms | 0.00083ms |
| advanceEscalation | cpu | 0.09ms | 0.11ms | 0.0011ms | 0.013 | 0.012 | n/a | 20.0% | 0.0010ms | 0.00096ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.02ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| evaluateRules | 7984 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| routeAlert | 27000 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| advanceEscalation | 50144 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0021ms |
| p95 | 0.0056ms |
| p99 | 0.0090ms |
| mean | 0.0029ms |
| stdev | 0.0018ms |
| min | 0.0018ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0019ms | -0.00014ms | -7.46% |
| p50 | 0.0019ms | 0.0034ms | -0.0014ms | -41.95% |
| p95 | 0.0052ms | 0.03ms | -0.03ms | -84.54% |
| p99 | 0.0083ms | 0.06ms | -0.05ms | -86.66% |
| mean | 0.0027ms | 0.0098ms | -0.0071ms | -72.44% |
| min | 0.0017ms | 0.0018ms | -0.000095ms | -5.29% |
| max | 0.01ms | 0.06ms | -0.05ms | -84.14% |
| total | 0.11ms | 0.39ms | -0.28ms | -72.44% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0067ms |
| p99 | 0.0093ms |
| mean | 0.0016ms |
| stdev | 0.0020ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00081ms | 0.00083ms | -0.000024ms | -2.84% |
| p50 | 0.00085ms | 0.00088ms | -0.000027ms | -3.07% |
| p95 | 0.0062ms | 0.01ms | -0.0056ms | -47.63% |
| p99 | 0.0086ms | 0.02ms | -0.0066ms | -43.34% |
| mean | 0.0015ms | 0.0025ms | -0.0011ms | -41.49% |
| min | 0.00081ms | 0.00083ms | -0.000024ms | -2.84% |
| max | 0.0094ms | 0.02ms | -0.0076ms | -44.78% |
| total | 0.06ms | 0.10ms | -0.04ms | -41.49% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0050ms |
| p99 | 0.01ms |
| mean | 0.0022ms |
| stdev | 0.0030ms |
| min | 0.0011ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00096ms | +0.000079ms | +8.24% |
| p50 | 0.0011ms | 0.0010ms | +0.000054ms | +5.15% |
| p95 | 0.0046ms | 0.0064ms | -0.0018ms | -28.19% |
| p99 | 0.01ms | 0.01ms | +0.00040ms | +3.06% |
| mean | 0.0020ms | 0.0018ms | +0.00017ms | +9.42% |
| min | 0.0010ms | 0.00096ms | +0.000042ms | +4.40% |
| max | 0.02ms | 0.02ms | +0.00088ms | +5.22% |
| total | 0.08ms | 0.07ms | +0.0069ms | +9.42% |

