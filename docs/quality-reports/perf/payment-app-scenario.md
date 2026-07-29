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
| webhook_verify_cycle (10x sign + verify) | 0.28ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.17ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -10320 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -3960 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | -8 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0058ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.01ms | -16.94% |
| p50 | 0.06ms | 0.07ms | -0.01ms | -19.99% |
| p95 | 0.07ms | 0.32ms | -0.25ms | -78.16% |
| p99 | 0.07ms | 1.44ms | -1.37ms | -95.10% |
| mean | 0.06ms | 0.17ms | -0.11ms | -65.12% |
| min | 0.05ms | 0.06ms | -0.0084ms | -14.01% |
| max | 0.07ms | 1.72ms | -1.65ms | -95.90% |
| total | 1.20ms | 3.44ms | -2.24ms | -65.12% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0016ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0022ms | -8.35% |
| p50 | 0.02ms | 0.03ms | -0.0022ms | -8.11% |
| p95 | 0.03ms | 0.03ms | -0.0032ms | -10.17% |
| p99 | 0.03ms | 0.03ms | -0.0026ms | -7.98% |
| mean | 0.03ms | 0.03ms | -0.0023ms | -8.15% |
| min | 0.02ms | 0.03ms | -0.0023ms | -8.66% |
| max | 0.03ms | 0.03ms | -0.0025ms | -7.46% |
| total | 0.51ms | 0.55ms | -0.05ms | -8.15% |

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
| stdev | 0.0031ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0058ms | -12.76% |
| p50 | 0.04ms | 0.05ms | -0.0068ms | -14.56% |
| p95 | 0.04ms | 0.30ms | -0.25ms | -85.05% |
| p99 | 0.05ms | 0.30ms | -0.25ms | -83.03% |
| mean | 0.04ms | 0.08ms | -0.04ms | -49.41% |
| min | 0.04ms | 0.04ms | -0.0057ms | -12.68% |
| max | 0.05ms | 0.30ms | -0.25ms | -82.53% |
| total | 0.82ms | 1.62ms | -0.80ms | -49.41% |

