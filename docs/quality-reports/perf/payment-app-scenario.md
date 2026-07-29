# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.06ms | 0.08ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.05ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.23ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 3.94ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.19ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -19160 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -4712 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | -8 B | 0 B | 102400 B | yes | PASS |

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
| total | 1.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0057ms | -8.91% |
| p50 | 0.07ms | 0.07ms | -0.0067ms | -8.94% |
| p95 | 0.08ms | 0.32ms | -0.24ms | -75.47% |
| p99 | 0.09ms | 1.44ms | -1.36ms | -93.87% |
| mean | 0.07ms | 0.17ms | -0.10ms | -60.17% |
| min | 0.06ms | 0.06ms | -0.0045ms | -7.46% |
| max | 0.09ms | 1.72ms | -1.63ms | -94.73% |
| total | 1.37ms | 3.44ms | -2.07ms | -60.17% |

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
| stdev | 0.0021ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00017ms | -0.64% |
| p50 | 0.03ms | 0.03ms | +0.0021ms | +7.80% |
| p95 | 0.03ms | 0.03ms | +0.0017ms | +5.44% |
| p99 | 0.03ms | 0.03ms | +0.00027ms | +0.84% |
| mean | 0.03ms | 0.03ms | +0.0013ms | +4.69% |
| min | 0.03ms | 0.03ms | -0.00029ms | -1.10% |
| max | 0.03ms | 0.03ms | -0.000083ms | -0.25% |
| total | 0.58ms | 0.55ms | +0.03ms | +4.69% |

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
| stdev | 0.0038ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0033ms | -7.27% |
| p50 | 0.04ms | 0.05ms | -0.0038ms | -8.17% |
| p95 | 0.05ms | 0.30ms | -0.24ms | -81.66% |
| p99 | 0.05ms | 0.30ms | -0.25ms | -81.97% |
| mean | 0.04ms | 0.08ms | -0.04ms | -45.45% |
| min | 0.04ms | 0.04ms | -0.0032ms | -7.22% |
| max | 0.05ms | 0.30ms | -0.25ms | -82.05% |
| total | 0.89ms | 1.62ms | -0.74ms | -45.45% |

