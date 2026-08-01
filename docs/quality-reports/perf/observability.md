# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.02ms | 0.06ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +93% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0053ms | 0.02ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00021ms | 0.00093ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +148%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0018ms | 0.0055ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| collectRunHistory | cpu | 0.09ms | 0.17ms | 0.02ms | 0.184 | 0.190 | n/a | 20.0% | 0.01ms | 0.02ms |
| detectFlaky | cpu | 0.09ms | 0.13ms | 0.0053ms | 0.062 | 0.059 | n/a | 20.0% | 0.0049ms | 0.0047ms |
| checkThresholds | cpu | 0.09ms | 0.09ms | 0.00021ms | 0.002 | 0.003 | n/a | 20.0% | 0.00019ms | 0.00021ms |
| renderDashboard | cpu | 0.08ms | 0.09ms | 0.0018ms | 0.022 | 0.022 | n/a | 20.0% | 0.0017ms | 0.0018ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.52ms | 10ms | PASS |
| detectFlaky | 0.09ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| collectRunHistory | -2880 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| detectFlaky | -7864 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| checkThresholds | 2680 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| renderDashboard | 744 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.17ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.45ms |
| total | 5.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00047ms | -3.14% |
| p50 | 0.02ms | 0.02ms | +0.00020ms | +1.14% |
| p95 | 0.06ms | 0.03ms | +0.03ms | +93.42% |
| p99 | 0.15ms | 0.05ms | +0.11ms | +218.59% |
| mean | 0.03ms | 0.02ms | +0.0063ms | +30.37% |
| min | 0.01ms | 0.01ms | -0.00036ms | -2.47% |
| max | 0.42ms | 0.36ms | +0.06ms | +16.75% |
| total | 5.39ms | 4.14ms | +1.26ms | +30.37% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0053ms |
| p50 | 0.0056ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0078ms |
| stdev | 0.0052ms |
| min | 0.0052ms |
| max | 0.03ms |
| total | 1.55ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.928)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0047ms | +0.00028ms | +6.06% |
| p50 | 0.0052ms | 0.0048ms | +0.00045ms | +9.37% |
| p95 | 0.02ms | 0.01ms | +0.0049ms | +33.78% |
| p99 | 0.03ms | 0.02ms | +0.0085ms | +45.70% |
| mean | 0.0072ms | 0.0058ms | +0.0014ms | +24.95% |
| min | 0.0048ms | 0.0046ms | +0.00021ms | +4.53% |
| max | 0.03ms | 0.03ms | -0.0013ms | -4.42% |
| total | 1.44ms | 1.15ms | +0.29ms | +24.95% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00042ms |
| p95 | 0.00093ms |
| p99 | 0.01ms |
| mean | 0.00069ms |
| stdev | 0.0018ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.932)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00021ms | -0.000014ms | -6.75% |
| p50 | 0.00039ms | 0.00038ms | +0.000014ms | +3.69% |
| p95 | 0.00086ms | 0.0011ms | -0.00022ms | -20.31% |
| p99 | 0.01ms | 0.0067ms | +0.0041ms | +61.40% |
| mean | 0.00064ms | 0.00065ms | -0.0000016ms | -0.25% |
| min | 0.00015ms | 0.00017ms | -0.000011ms | -6.75% |
| max | 0.02ms | 0.02ms | -0.0024ms | -12.54% |
| total | 0.13ms | 0.13ms | -0.00032ms | -0.25% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0055ms |
| p99 | 0.02ms |
| mean | 0.0026ms |
| stdev | 0.0028ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.51ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.943)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.000059ms | -3.29% |
| p50 | 0.0018ms | 0.0018ms | -0.000065ms | -3.56% |
| p95 | 0.0052ms | 0.0062ms | -0.0010ms | -16.82% |
| p99 | 0.02ms | 0.02ms | -0.0012ms | -7.08% |
| mean | 0.0024ms | 0.0024ms | -0.000026ms | -1.06% |
| min | 0.0017ms | 0.0017ms | -0.000019ms | -1.14% |
| max | 0.02ms | 0.02ms | +0.0045ms | +24.48% |
| total | 0.48ms | 0.49ms | -0.0052ms | -1.06% |

