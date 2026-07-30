# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.06ms | 0.08ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 0.04ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.05ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | cpu | 0.08ms | 0.10ms | 0.06ms | 0.691 | 0.655 | 0.06ms | 0.05ms |
| handler_dispatch (3 handler + emit 10 events) | cpu | 0.08ms | 0.09ms | 0.03ms | 0.319 | 0.310 | 0.03ms | 0.03ms |
| bulk_sign (20 signWebhook rapid) | cpu | 0.08ms | 0.08ms | 0.04ms | 0.510 | 0.509 | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.22ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.15ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.18ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -10304 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -5288 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.07ms |
| stdev | 0.0086ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.0030ms | +5.50% |
| p50 | 0.07ms | 0.06ms | +0.0090ms | +15.89% |
| p95 | 0.08ms | 0.08ms | -0.00074ms | -0.93% |
| p99 | 0.09ms | 0.09ms | +0.0032ms | +3.70% |
| mean | 0.07ms | 0.06ms | +0.0054ms | +8.83% |
| min | 0.06ms | 0.05ms | +0.0045ms | +8.83% |
| max | 0.09ms | 0.09ms | +0.0041ms | +4.77% |
| total | 1.33ms | 1.22ms | +0.11ms | +8.83% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.983)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00079ms | +3.12% |
| p50 | 0.03ms | 0.03ms | +0.0015ms | +5.74% |
| p95 | 0.04ms | 0.04ms | +0.00055ms | +1.51% |
| p99 | 0.07ms | 0.05ms | +0.01ms | +29.65% |
| mean | 0.03ms | 0.03ms | +0.0020ms | +7.20% |
| min | 0.03ms | 0.03ms | +0.00055ms | +2.20% |
| max | 0.07ms | 0.05ms | +0.02ms | +34.37% |
| total | 0.60ms | 0.56ms | +0.04ms | +7.20% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0015ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.85ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.016)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.000081ms | +0.19% |
| p50 | 0.04ms | 0.04ms | +0.00045ms | +1.06% |
| p95 | 0.05ms | 0.04ms | +0.0016ms | +3.63% |
| p99 | 0.05ms | 0.05ms | +0.00046ms | +0.98% |
| mean | 0.04ms | 0.04ms | +0.00040ms | +0.93% |
| min | 0.04ms | 0.04ms | +0.00033ms | +0.79% |
| max | 0.05ms | 0.05ms | +0.00018ms | +0.37% |
| total | 0.86ms | 0.86ms | +0.0080ms | +0.93% |

