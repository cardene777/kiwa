# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0068ms | 0.03ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 -5% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0016ms | 0.0033ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0040ms | 100ms | 0.0011ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +102% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | cpu | 0.09ms | 0.13ms | 0.0068ms | 0.079 | 0.083 | n/a | 20.0% | 0.0066ms | 0.0069ms |
| push_batch (5 sendPush with high-priority payload) | cpu | 0.09ms | 0.10ms | 0.0016ms | 0.018 | 0.019 | n/a | 20.0% | 0.0015ms | 0.0015ms |
| sms_error_handling (5 failOn callback path) | cpu | 0.09ms | 0.10ms | 0.0015ms | 0.017 | 0.016 | n/a | 20.0% | 0.0014ms | 0.0014ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.03ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -11672 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| push_batch (5 sendPush with high-priority payload) | -456 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| sms_error_handling (5 failOn callback path) | 616 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0068ms |
| p50 | 0.0083ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0065ms |
| max | 0.08ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.970)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0069ms | -0.00032ms | -4.67% |
| p50 | 0.0080ms | 0.0076ms | +0.00040ms | +5.24% |
| p95 | 0.03ms | 0.02ms | +0.0059ms | +25.56% |
| p99 | 0.07ms | 0.02ms | +0.04ms | +186.79% |
| mean | 0.01ms | 0.01ms | +0.0028ms | +27.04% |
| min | 0.0063ms | 0.0063ms | -0.000027ms | -0.43% |
| max | 0.08ms | 0.02ms | +0.05ms | +226.22% |
| total | 0.26ms | 0.21ms | +0.06ms | +27.04% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0018ms |
| p95 | 0.0033ms |
| p99 | 0.0034ms |
| mean | 0.0021ms |
| stdev | 0.00058ms |
| min | 0.0016ms |
| max | 0.0034ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.908)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | -0.000025ms | -1.67% |
| p50 | 0.0016ms | 0.0015ms | +0.000084ms | +5.48% |
| p95 | 0.0030ms | 0.0022ms | +0.00076ms | +34.31% |
| p99 | 0.0030ms | 0.0025ms | +0.00054ms | +21.38% |
| mean | 0.0019ms | 0.0017ms | +0.00021ms | +12.25% |
| min | 0.0015ms | 0.0015ms | +0.000017ms | +1.16% |
| max | 0.0031ms | 0.0026ms | +0.00048ms | +18.59% |
| total | 0.04ms | 0.03ms | +0.0041ms | +12.25% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0040ms |
| p99 | 0.01ms |
| mean | 0.0023ms |
| stdev | 0.0030ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.929)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | +0.000018ms | +1.34% |
| p50 | 0.0014ms | 0.0015ms | -0.000068ms | -4.50% |
| p95 | 0.0037ms | 0.0018ms | +0.0019ms | +102.47% |
| p99 | 0.01ms | 0.0024ms | +0.0094ms | +384.93% |
| mean | 0.0021ms | 0.0016ms | +0.00056ms | +35.32% |
| min | 0.0014ms | 0.0014ms | -0.000020ms | -1.43% |
| max | 0.01ms | 0.0026ms | +0.01ms | +434.98% |
| total | 0.04ms | 0.03ms | +0.01ms | +35.32% |

