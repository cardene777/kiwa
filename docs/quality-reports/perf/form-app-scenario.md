# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.07ms | 0.10ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0027ms | 0.0051ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +49% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.03ms | 0.09ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +157% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | cpu | 0.09ms | 0.10ms | 0.07ms | 0.777 | 0.790 | n/a | 20.0% | 0.07ms | 0.07ms |
| multi_field_validate_batch (5 provider-mixed validate) | cpu | 0.09ms | 0.10ms | 0.0027ms | 0.029 | 0.029 | n/a | 20.0% | 0.0024ms | 0.0024ms |
| submit_error_handling (5 required-missing → onError catch) | cpu | 0.09ms | 0.12ms | 0.03ms | 0.291 | 0.285 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.37ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 31464 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | -2840 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| submit_error_handling (5 required-missing → onError catch) | 24 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.08ms |
| p95 | 0.10ms |
| p99 | 0.10ms |
| mean | 0.08ms |
| stdev | 0.0079ms |
| min | 0.07ms |
| max | 0.10ms |
| total | 1.62ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.885)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.07ms | -0.0011ms | -1.63% |
| p50 | 0.07ms | 0.08ms | -0.0066ms | -8.69% |
| p95 | 0.09ms | 0.10ms | -0.02ms | -18.00% |
| p99 | 0.09ms | 0.14ms | -0.06ms | -40.01% |
| mean | 0.07ms | 0.08ms | -0.0081ms | -10.15% |
| min | 0.06ms | 0.07ms | -0.0023ms | -3.47% |
| max | 0.09ms | 0.15ms | -0.07ms | -43.76% |
| total | 1.43ms | 1.59ms | -0.16ms | -10.15% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0051ms |
| p99 | 0.0089ms |
| mean | 0.0032ms |
| stdev | 0.0016ms |
| min | 0.0026ms |
| max | 0.0098ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.891)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | -0.000040ms | -1.66% |
| p50 | 0.0024ms | 0.0025ms | -0.000068ms | -2.71% |
| p95 | 0.0046ms | 0.0031ms | +0.0015ms | +48.70% |
| p99 | 0.0079ms | 0.0041ms | +0.0038ms | +91.85% |
| mean | 0.0029ms | 0.0026ms | +0.00026ms | +10.08% |
| min | 0.0023ms | 0.0024ms | -0.000036ms | -1.51% |
| max | 0.0087ms | 0.0044ms | +0.0043ms | +99.42% |
| total | 0.06ms | 0.05ms | +0.0053ms | +10.08% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.09ms |
| p99 | 0.15ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.16ms |
| total | 0.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00048ms | +2.08% |
| p50 | 0.03ms | 0.02ms | +0.0032ms | +13.62% |
| p95 | 0.08ms | 0.03ms | +0.05ms | +157.15% |
| p99 | 0.13ms | 0.04ms | +0.09ms | +215.49% |
| mean | 0.04ms | 0.03ms | +0.01ms | +46.90% |
| min | 0.02ms | 0.02ms | +0.00011ms | +0.50% |
| max | 0.14ms | 0.04ms | +0.10ms | +225.97% |
| total | 0.74ms | 0.50ms | +0.24ms | +46.90% |

