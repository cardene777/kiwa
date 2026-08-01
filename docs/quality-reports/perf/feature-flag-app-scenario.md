# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0074ms | 0.04ms | 100ms | 0.00045ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +328% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0071ms | 0.05ms | 100ms | 0.00043ms | PASS | stable (換算後 p10 +19% (閾値未満)、 p95 +285% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0038ms | 0.03ms | 100ms | 0.00044ms | PASS | stable (換算後 p10 +13% (閾値未満)、 p95 +404% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | cpu | 0.09ms | 0.14ms | 0.0074ms | 0.079 | 0.077 | n/a | 20.0% | 0.0066ms | 0.0065ms |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | cpu | 0.09ms | 0.16ms | 0.0071ms | 0.076 | 0.063 | n/a | 20.0% | 0.0061ms | 0.0051ms |
| rule_error_handling (5 unknown flag + attribute mismatch) | cpu | 0.09ms | 0.13ms | 0.0038ms | 0.041 | 0.036 | n/a | 20.0% | 0.0034ms | 0.0030ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.09ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.14ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | -54400 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 23424 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0095ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0073ms |
| max | 0.04ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.892)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0065ms | +0.00016ms | +2.48% |
| p50 | 0.0085ms | 0.0067ms | +0.0018ms | +27.10% |
| p95 | 0.04ms | 0.0083ms | +0.03ms | +328.23% |
| p99 | 0.04ms | 0.01ms | +0.02ms | +210.38% |
| mean | 0.01ms | 0.0071ms | +0.0071ms | +99.97% |
| min | 0.0065ms | 0.0063ms | +0.00017ms | +2.67% |
| max | 0.04ms | 0.01ms | +0.02ms | +190.96% |
| total | 0.28ms | 0.14ms | +0.14ms | +99.97% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0082ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0067ms |
| max | 0.05ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.855)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0051ms | +0.00099ms | +19.47% |
| p50 | 0.0070ms | 0.0061ms | +0.00088ms | +14.31% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +285.47% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +99.31% |
| mean | 0.01ms | 0.0072ms | +0.0055ms | +75.66% |
| min | 0.0057ms | 0.0050ms | +0.00070ms | +14.01% |
| max | 0.04ms | 0.03ms | +0.02ms | +78.84% |
| total | 0.25ms | 0.14ms | +0.11ms | +75.66% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0085ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0091ms |
| min | 0.0035ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.878)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0030ms | +0.00039ms | +13.30% |
| p50 | 0.0074ms | 0.0030ms | +0.0044ms | +144.20% |
| p95 | 0.03ms | 0.0052ms | +0.02ms | +403.67% |
| p99 | 0.03ms | 0.0067ms | +0.02ms | +333.01% |
| mean | 0.0098ms | 0.0034ms | +0.0064ms | +189.69% |
| min | 0.0031ms | 0.0029ms | +0.00016ms | +5.40% |
| max | 0.03ms | 0.0071ms | +0.02ms | +319.99% |
| total | 0.20ms | 0.07ms | +0.13ms | +189.69% |

