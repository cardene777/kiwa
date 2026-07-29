# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0049ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.21ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -14272 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 1344 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 1256 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0066ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00068ms | -1.33% |
| p50 | 0.06ms | 0.06ms | -0.0042ms | -6.56% |
| p95 | 0.07ms | 0.08ms | -0.0075ms | -9.70% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -23.42% |
| mean | 0.06ms | 0.07ms | -0.0063ms | -9.59% |
| min | 0.05ms | 0.05ms | -0.00042ms | -0.83% |
| max | 0.07ms | 0.10ms | -0.02ms | -26.20% |
| total | 1.18ms | 1.31ms | -0.13ms | -9.59% |

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
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0013ms | -7.53% |
| p50 | 0.02ms | 0.02ms | -0.00085ms | -4.87% |
| p95 | 0.02ms | 0.05ms | -0.03ms | -54.76% |
| p99 | 0.03ms | 0.16ms | -0.13ms | -82.74% |
| mean | 0.02ms | 0.03ms | -0.0098ms | -35.21% |
| min | 0.02ms | 0.02ms | -0.0016ms | -9.27% |
| max | 0.03ms | 0.19ms | -0.16ms | -84.56% |
| total | 0.36ms | 0.56ms | -0.20ms | -35.21% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0050ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0058ms |
| stdev | 0.0018ms |
| min | 0.0048ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0050ms | -0.00016ms | -3.23% |
| p50 | 0.0050ms | 0.0059ms | -0.00092ms | -15.44% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -87.27% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -91.06% |
| mean | 0.0058ms | 0.02ms | -0.01ms | -68.93% |
| min | 0.0048ms | 0.0050ms | -0.00013ms | -2.52% |
| max | 0.01ms | 0.13ms | -0.12ms | -91.66% |
| total | 0.12ms | 0.37ms | -0.26ms | -68.93% |

