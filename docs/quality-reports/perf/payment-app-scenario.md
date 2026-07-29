# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.04ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.20ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.25ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -8792 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -3464 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 520 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.0068ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.01ms | -19.61% |
| p50 | 0.06ms | 0.07ms | -0.02ms | -21.33% |
| p95 | 0.07ms | 0.32ms | -0.25ms | -78.02% |
| p99 | 0.07ms | 1.44ms | -1.37ms | -94.93% |
| mean | 0.06ms | 0.17ms | -0.11ms | -65.20% |
| min | 0.05ms | 0.06ms | -0.01ms | -17.84% |
| max | 0.07ms | 1.72ms | -1.65ms | -95.72% |
| total | 1.20ms | 3.44ms | -2.24ms | -65.20% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0024ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0016ms | -6.01% |
| p50 | 0.03ms | 0.03ms | -0.0016ms | -6.11% |
| p95 | 0.03ms | 0.03ms | -0.00076ms | -2.45% |
| p99 | 0.03ms | 0.03ms | +0.00095ms | +2.91% |
| mean | 0.03ms | 0.03ms | -0.0014ms | -4.95% |
| min | 0.02ms | 0.03ms | -0.0016ms | -6.14% |
| max | 0.03ms | 0.03ms | +0.0014ms | +4.18% |
| total | 0.52ms | 0.55ms | -0.03ms | -4.95% |

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
| stdev | 0.0015ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0041ms | -8.98% |
| p50 | 0.04ms | 0.05ms | -0.0047ms | -10.18% |
| p95 | 0.04ms | 0.30ms | -0.25ms | -85.47% |
| p99 | 0.05ms | 0.30ms | -0.26ms | -84.39% |
| mean | 0.04ms | 0.08ms | -0.04ms | -47.96% |
| min | 0.04ms | 0.04ms | -0.0040ms | -8.98% |
| max | 0.05ms | 0.30ms | -0.26ms | -84.12% |
| total | 0.84ms | 1.62ms | -0.78ms | -47.96% |

