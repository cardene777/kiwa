# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.05ms | 0.08ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 0.05ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.27ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.12ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.18ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -10184 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -3880 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 72 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0079ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.01ms | -16.33% |
| p50 | 0.06ms | 0.07ms | -0.01ms | -14.87% |
| p95 | 0.08ms | 0.32ms | -0.25ms | -76.09% |
| p99 | 0.08ms | 1.44ms | -1.37ms | -94.57% |
| mean | 0.06ms | 0.17ms | -0.11ms | -62.59% |
| min | 0.05ms | 0.06ms | -0.0082ms | -13.73% |
| max | 0.08ms | 1.72ms | -1.65ms | -95.44% |
| total | 1.29ms | 3.44ms | -2.15ms | -62.59% |

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
| stdev | 0.0011ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00021ms | +0.78% |
| p50 | 0.03ms | 0.03ms | +0.00040ms | +1.47% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -4.92% |
| p99 | 0.03ms | 0.03ms | -0.0020ms | -6.26% |
| mean | 0.03ms | 0.03ms | +0.000027ms | +0.10% |
| min | 0.03ms | 0.03ms | +0.00013ms | +0.47% |
| max | 0.03ms | 0.03ms | -0.0022ms | -6.57% |
| total | 0.55ms | 0.55ms | +0.00054ms | +0.10% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.0098ms |
| min | 0.04ms |
| max | 0.09ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0043ms | -9.47% |
| p50 | 0.04ms | 0.05ms | -0.0041ms | -8.75% |
| p95 | 0.05ms | 0.30ms | -0.25ms | -83.40% |
| p99 | 0.08ms | 0.30ms | -0.22ms | -73.94% |
| mean | 0.05ms | 0.08ms | -0.04ms | -44.37% |
| min | 0.04ms | 0.04ms | -0.0044ms | -9.82% |
| max | 0.09ms | 0.30ms | -0.22ms | -71.62% |
| total | 0.90ms | 1.62ms | -0.72ms | -44.37% |

