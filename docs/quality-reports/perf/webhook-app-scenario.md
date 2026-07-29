# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0050ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.20ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -2616 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 384 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 200 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0066ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00059ms | -1.15% |
| p50 | 0.06ms | 0.06ms | -0.0053ms | -8.23% |
| p95 | 0.07ms | 0.08ms | -0.01ms | -13.26% |
| p99 | 0.08ms | 0.09ms | -0.02ms | -16.90% |
| mean | 0.06ms | 0.07ms | -0.0058ms | -8.86% |
| min | 0.05ms | 0.05ms | +0.000083ms | +0.17% |
| max | 0.08ms | 0.10ms | -0.02ms | -17.64% |
| total | 1.19ms | 1.31ms | -0.12ms | -8.86% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0049ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00079ms | -4.59% |
| p50 | 0.02ms | 0.02ms | +0.0015ms | +8.44% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -37.88% |
| p99 | 0.03ms | 0.16ms | -0.13ms | -78.68% |
| mean | 0.02ms | 0.03ms | -0.0072ms | -25.95% |
| min | 0.02ms | 0.02ms | -0.0011ms | -6.35% |
| max | 0.04ms | 0.19ms | -0.15ms | -81.33% |
| total | 0.41ms | 0.56ms | -0.14ms | -25.95% |

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
| stdev | 0.0023ms |
| min | 0.0050ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0050ms | -0.000038ms | -0.75% |
| p50 | 0.0052ms | 0.0059ms | -0.00069ms | -11.59% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -87.66% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -89.17% |
| mean | 0.0062ms | 0.02ms | -0.01ms | -66.35% |
| min | 0.0050ms | 0.0050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.13ms | -0.12ms | -89.40% |
| total | 0.12ms | 0.37ms | -0.25ms | -66.35% |

