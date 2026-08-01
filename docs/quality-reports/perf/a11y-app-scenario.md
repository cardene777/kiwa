# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 23.06ms | 29.53ms | 1200ms | 0.00039ms | PASS | stable — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 18.58ms | 26.36ms | 900ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 14.13ms | 22.19ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | cpu | 0.11ms | 0.14ms | 23.06ms | 217.996 | 240.124 | n/a | 20.0% | 17.87ms | 19.69ms |
| violation_report_batch (2 dirty runAxe + reportViolations) | cpu | 0.09ms | 0.11ms | 18.58ms | 207.392 | 182.478 | n/a | 20.0% | 17.00ms | 14.95ms |
| audit_error_handling (3 invalid-context throw + catch) | cpu | 0.09ms | 0.11ms | 14.13ms | 157.574 | 159.866 | n/a | 20.0% | 12.95ms | 13.14ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 108.88ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 78.76ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 79.65ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -301928 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -76656 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -133728 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 23.06ms |
| p50 | 25.03ms |
| p95 | 29.53ms |
| p99 | 30.55ms |
| mean | 25.39ms |
| stdev | 2.22ms |
| min | 22.93ms |
| max | 30.81ms |
| total | 507.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.775)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.87ms | 19.69ms | -1.81ms | -9.21% |
| p50 | 19.40ms | 22.07ms | -2.67ms | -12.12% |
| p95 | 22.89ms | 25.24ms | -2.35ms | -9.30% |
| p99 | 23.68ms | 25.58ms | -1.90ms | -7.43% |
| mean | 19.68ms | 21.94ms | -2.26ms | -10.32% |
| min | 17.77ms | 18.93ms | -1.16ms | -6.15% |
| max | 23.88ms | 25.67ms | -1.79ms | -6.98% |
| total | 393.50ms | 438.77ms | -45.27ms | -10.32% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 18.58ms |
| p50 | 19.82ms |
| p95 | 26.36ms |
| p99 | 31.29ms |
| mean | 21.20ms |
| stdev | 3.59ms |
| min | 17.25ms |
| max | 32.52ms |
| total | 423.96ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.00ms | 14.95ms | +2.04ms | +13.65% |
| p50 | 18.12ms | 15.80ms | +2.32ms | +14.68% |
| p95 | 24.10ms | 21.86ms | +2.24ms | +10.23% |
| p99 | 28.61ms | 22.20ms | +6.41ms | +28.87% |
| mean | 19.38ms | 16.73ms | +2.65ms | +15.86% |
| min | 15.78ms | 14.22ms | +1.56ms | +10.95% |
| max | 29.74ms | 22.29ms | +7.45ms | +33.44% |
| total | 387.69ms | 334.61ms | +53.07ms | +15.86% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.13ms |
| p50 | 15.86ms |
| p95 | 22.19ms |
| p99 | 22.60ms |
| mean | 16.83ms |
| stdev | 2.81ms |
| min | 13.01ms |
| max | 22.71ms |
| total | 336.56ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.95ms | 13.14ms | -0.19ms | -1.43% |
| p50 | 14.54ms | 14.34ms | +0.20ms | +1.38% |
| p95 | 20.34ms | 15.06ms | +5.28ms | +35.08% |
| p99 | 20.72ms | 15.28ms | +5.43ms | +35.55% |
| mean | 15.42ms | 14.11ms | +1.31ms | +9.29% |
| min | 11.92ms | 12.69ms | -0.77ms | -6.08% |
| max | 20.81ms | 15.34ms | +5.47ms | +35.66% |
| total | 308.44ms | 282.22ms | +26.22ms | +9.29% |

