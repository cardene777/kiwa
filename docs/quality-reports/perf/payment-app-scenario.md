# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.05ms | 0.07ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.04ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | cpu | 0.08ms | 0.09ms | 0.05ms | 0.641 | 0.655 | n/a | 20.0% | 0.05ms | 0.05ms |
| handler_dispatch (3 handler + emit 10 events) | cpu | 0.08ms | 0.09ms | 0.03ms | 0.308 | 0.310 | n/a | 20.0% | 0.03ms | 0.03ms |
| bulk_sign (20 signWebhook rapid) | cpu | 0.08ms | 0.08ms | 0.04ms | 0.502 | 0.509 | n/a | 20.0% | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.20ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.18ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -183960 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| handler_dispatch (3 handler + emit 10 events) | -5288 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| bulk_sign (20 signWebhook rapid) | 552 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0068ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0012ms | -2.15% |
| p50 | 0.06ms | 0.06ms | +0.0017ms | +2.99% |
| p95 | 0.07ms | 0.08ms | -0.0088ms | -11.01% |
| p99 | 0.08ms | 0.09ms | -0.0095ms | -11.13% |
| mean | 0.06ms | 0.06ms | -0.00098ms | -1.60% |
| min | 0.05ms | 0.05ms | +0.00080ms | +1.57% |
| max | 0.08ms | 0.09ms | -0.0097ms | -11.16% |
| total | 1.20ms | 1.22ms | -0.02ms | -1.60% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0019ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.988)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00010ms | -0.41% |
| p50 | 0.03ms | 0.03ms | -0.000098ms | -0.37% |
| p95 | 0.03ms | 0.04ms | -0.0064ms | -17.56% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -38.75% |
| mean | 0.03ms | 0.03ms | -0.0013ms | -4.55% |
| min | 0.02ms | 0.03ms | -0.00039ms | -1.57% |
| max | 0.03ms | 0.05ms | -0.02ms | -42.30% |
| total | 0.54ms | 0.56ms | -0.03ms | -4.55% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0012ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.014)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00057ms | -1.37% |
| p50 | 0.04ms | 0.04ms | -0.00032ms | -0.76% |
| p95 | 0.04ms | 0.04ms | -0.00075ms | -1.69% |
| p99 | 0.05ms | 0.05ms | -0.0012ms | -2.45% |
| mean | 0.04ms | 0.04ms | -0.00046ms | -1.06% |
| min | 0.04ms | 0.04ms | -0.00029ms | -0.71% |
| max | 0.05ms | 0.05ms | -0.0013ms | -2.63% |
| total | 0.85ms | 0.86ms | -0.0091ms | -1.06% |

