# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.05ms | 0.08ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.05ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | cpu | 0.08ms | 0.05ms | 0.596 | 0.623 | 0.05ms | 0.05ms |
| handler_dispatch (3 handler + emit 10 events) | cpu | 0.08ms | 0.03ms | 0.304 | 0.309 | 0.02ms | 0.03ms |
| bulk_sign (20 signWebhook rapid) | cpu | 0.08ms | 0.04ms | 0.502 | 0.505 | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.20ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.18ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -231160 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -3352 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.11ms |
| total | 1.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00043ms | -0.85% |
| p50 | 0.06ms | 0.06ms | -0.0026ms | -4.40% |
| p95 | 0.08ms | 0.07ms | +0.01ms | +18.99% |
| p99 | 0.10ms | 0.07ms | +0.03ms | +48.72% |
| mean | 0.06ms | 0.06ms | +0.0031ms | +5.32% |
| min | 0.05ms | 0.05ms | +0.00075ms | +1.54% |
| max | 0.11ms | 0.07ms | +0.04ms | +55.98% |
| total | 1.23ms | 1.16ms | +0.06ms | +5.32% |

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
| stdev | 0.0025ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00020ms | +0.82% |
| p50 | 0.03ms | 0.03ms | +0.00019ms | +0.73% |
| p95 | 0.03ms | 0.04ms | -0.0076ms | -19.11% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -55.00% |
| mean | 0.03ms | 0.03ms | -0.0027ms | -9.17% |
| min | 0.03ms | 0.02ms | +0.00012ms | +0.50% |
| max | 0.03ms | 0.08ms | -0.05ms | -59.41% |
| total | 0.54ms | 0.59ms | -0.05ms | -9.17% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0069ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00028ms | +0.69% |
| p50 | 0.04ms | 0.04ms | +5.0e-7ms | +0.00% |
| p95 | 0.05ms | 0.04ms | +0.0085ms | +19.02% |
| p99 | 0.07ms | 0.05ms | +0.02ms | +49.96% |
| mean | 0.05ms | 0.04ms | +0.0028ms | +6.60% |
| min | 0.04ms | 0.04ms | +0.00042ms | +1.02% |
| max | 0.07ms | 0.05ms | +0.03ms | +57.64% |
| total | 0.90ms | 0.84ms | +0.06ms | +6.60% |

