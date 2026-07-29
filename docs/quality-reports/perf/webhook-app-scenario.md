# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0050ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.21ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -4296 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 296 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 3160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.0059ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00034ms | -0.67% |
| p50 | 0.06ms | 0.06ms | -0.0045ms | -6.98% |
| p95 | 0.07ms | 0.08ms | -0.0094ms | -12.14% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -22.89% |
| mean | 0.06ms | 0.07ms | -0.0050ms | -7.62% |
| min | 0.05ms | 0.05ms | +0.00025ms | +0.50% |
| max | 0.07ms | 0.10ms | -0.02ms | -25.06% |
| total | 1.21ms | 1.31ms | -0.10ms | -7.62% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0032ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0015ms | -8.83% |
| p50 | 0.02ms | 0.02ms | -0.0012ms | -7.13% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -50.35% |
| p99 | 0.03ms | 0.16ms | -0.13ms | -83.23% |
| mean | 0.02ms | 0.03ms | -0.01ms | -36.56% |
| min | 0.02ms | 0.02ms | -0.0017ms | -10.24% |
| max | 0.03ms | 0.19ms | -0.16ms | -85.37% |
| total | 0.35ms | 0.56ms | -0.20ms | -36.56% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0052ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0062ms |
| stdev | 0.0022ms |
| min | 0.0049ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0050ms | -0.000038ms | -0.75% |
| p50 | 0.0052ms | 0.0059ms | -0.00069ms | -11.59% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -85.46% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -89.80% |
| mean | 0.0062ms | 0.02ms | -0.01ms | -66.55% |
| min | 0.0049ms | 0.0050ms | -0.000041ms | -0.83% |
| max | 0.01ms | 0.13ms | -0.12ms | -90.48% |
| total | 0.12ms | 0.37ms | -0.25ms | -66.55% |

