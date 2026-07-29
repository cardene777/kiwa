# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.05ms | 0.06ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.04ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.19ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.19ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -9224 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -4840 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.06ms |
| stdev | 0.0049ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.01ms | -20.13% |
| p50 | 0.06ms | 0.07ms | -0.02ms | -22.03% |
| p95 | 0.06ms | 0.32ms | -0.26ms | -80.44% |
| p99 | 0.06ms | 1.44ms | -1.38ms | -95.53% |
| mean | 0.06ms | 0.17ms | -0.11ms | -66.80% |
| min | 0.05ms | 0.06ms | -0.01ms | -20.91% |
| max | 0.06ms | 1.72ms | -1.66ms | -96.24% |
| total | 1.14ms | 3.44ms | -2.30ms | -66.80% |

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
| stdev | 0.0018ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0016ms | -6.18% |
| p50 | 0.03ms | 0.03ms | -0.0011ms | -4.02% |
| p95 | 0.03ms | 0.03ms | -0.0022ms | -7.05% |
| p99 | 0.03ms | 0.03ms | -0.0014ms | -4.31% |
| mean | 0.03ms | 0.03ms | -0.0012ms | -4.22% |
| min | 0.02ms | 0.03ms | -0.0020ms | -7.40% |
| max | 0.03ms | 0.03ms | -0.0012ms | -3.67% |
| total | 0.53ms | 0.55ms | -0.02ms | -4.22% |

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
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0044ms | -9.73% |
| p50 | 0.04ms | 0.05ms | -0.0041ms | -8.84% |
| p95 | 0.04ms | 0.30ms | -0.25ms | -84.86% |
| p99 | 0.05ms | 0.30ms | -0.26ms | -84.77% |
| mean | 0.04ms | 0.08ms | -0.04ms | -47.40% |
| min | 0.04ms | 0.04ms | -0.0042ms | -9.35% |
| max | 0.05ms | 0.30ms | -0.26ms | -84.74% |
| total | 0.85ms | 1.62ms | -0.77ms | -47.40% |

