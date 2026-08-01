# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0044ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +149% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0042ms | 0.02ms | 100ms | 0.00052ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +125% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | cpu | 0.09ms | 0.12ms | 0.0044ms | 0.047 | 0.048 | n/a | 20.0% | 0.0038ms | 0.0039ms |
| template_render_batch (5 render with data) | cpu | 0.09ms | 0.11ms | 0.0042ms | 0.045 | 0.044 | n/a | 20.0% | 0.0037ms | 0.0037ms |
| webhook_verify_delivery_batch (5 verify + parse) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.278 | 0.266 | n/a | 20.0% | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.32ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -11960 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| template_render_batch (5 render with data) | -3736 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | -6656 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0049ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0070ms |
| stdev | 0.0055ms |
| min | 0.0044ms |
| max | 0.03ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0039ms | -0.00013ms | -3.32% |
| p50 | 0.0042ms | 0.0041ms | +0.00017ms | +4.19% |
| p95 | 0.01ms | 0.0048ms | +0.0072ms | +148.81% |
| p99 | 0.02ms | 0.0056ms | +0.02ms | +285.14% |
| mean | 0.0061ms | 0.0042ms | +0.0018ms | +43.99% |
| min | 0.0038ms | 0.0039ms | -0.000093ms | -2.40% |
| max | 0.02ms | 0.0058ms | +0.02ms | +313.63% |
| total | 0.12ms | 0.08ms | +0.04ms | +43.99% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0046ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0065ms |
| stdev | 0.0044ms |
| min | 0.0041ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0037ms | +0.000046ms | +1.27% |
| p50 | 0.0041ms | 0.0038ms | +0.00026ms | +6.86% |
| p95 | 0.01ms | 0.0061ms | +0.0076ms | +124.58% |
| p99 | 0.02ms | 0.0088ms | +0.0093ms | +106.32% |
| mean | 0.0058ms | 0.0043ms | +0.0015ms | +35.22% |
| min | 0.0036ms | 0.0036ms | +0.000021ms | +0.57% |
| max | 0.02ms | 0.0095ms | +0.0098ms | +103.38% |
| total | 0.12ms | 0.09ms | +0.03ms | +35.22% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0040ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.856)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00098ms | +4.60% |
| p50 | 0.02ms | 0.02ms | +0.00061ms | +2.73% |
| p95 | 0.03ms | 0.03ms | +0.0018ms | +5.95% |
| p99 | 0.03ms | 0.03ms | +0.00076ms | +2.41% |
| mean | 0.02ms | 0.02ms | +0.00043ms | +1.80% |
| min | 0.02ms | 0.02ms | +0.00080ms | +3.77% |
| max | 0.03ms | 0.03ms | +0.00050ms | +1.57% |
| total | 0.49ms | 0.48ms | +0.0087ms | +1.80% |

