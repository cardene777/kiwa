# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.06ms | 0.16ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 0.04ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.05ms | 0.05ms | 50ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.21ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.15ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.21ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -8416 B | -126363 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -17016 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.16ms |
| p99 | 0.30ms |
| mean | 0.09ms |
| stdev | 0.06ms |
| min | 0.06ms |
| max | 0.33ms |
| total | 1.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0040ms | -6.17% |
| p50 | 0.07ms | 0.07ms | -0.0015ms | -2.06% |
| p95 | 0.16ms | 0.32ms | -0.16ms | -49.38% |
| p99 | 0.30ms | 1.44ms | -1.15ms | -79.29% |
| mean | 0.09ms | 0.17ms | -0.08ms | -46.98% |
| min | 0.06ms | 0.06ms | -0.0013ms | -2.16% |
| max | 0.33ms | 1.72ms | -1.39ms | -80.69% |
| total | 1.83ms | 3.44ms | -1.62ms | -46.98% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0058ms | +22.06% |
| p50 | 0.03ms | 0.03ms | +0.0064ms | +23.73% |
| p95 | 0.04ms | 0.03ms | +0.0089ms | +28.68% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +32.48% |
| mean | 0.03ms | 0.03ms | +0.0066ms | +24.03% |
| min | 0.03ms | 0.03ms | +0.0054ms | +20.47% |
| max | 0.04ms | 0.03ms | +0.01ms | +33.38% |
| total | 0.68ms | 0.55ms | +0.13ms | +24.03% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0033ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0013ms | +2.84% |
| p50 | 0.05ms | 0.05ms | +0.00087ms | +1.87% |
| p95 | 0.05ms | 0.30ms | -0.25ms | -82.52% |
| p99 | 0.06ms | 0.30ms | -0.24ms | -80.48% |
| mean | 0.05ms | 0.08ms | -0.03ms | -39.85% |
| min | 0.05ms | 0.04ms | +0.0010ms | +2.22% |
| max | 0.06ms | 0.30ms | -0.24ms | -79.98% |
| total | 0.98ms | 1.62ms | -0.65ms | -39.85% |

