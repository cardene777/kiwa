# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0048ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.20ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -14704 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | -18440 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 776 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0055ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0012ms | -2.43% |
| p50 | 0.06ms | 0.06ms | -0.0039ms | -6.02% |
| p95 | 0.07ms | 0.08ms | -0.01ms | -15.24% |
| p99 | 0.07ms | 0.09ms | -0.03ms | -28.02% |
| mean | 0.06ms | 0.07ms | -0.0065ms | -9.90% |
| min | 0.05ms | 0.05ms | -0.00063ms | -1.25% |
| max | 0.07ms | 0.10ms | -0.03ms | -30.61% |
| total | 1.18ms | 1.31ms | -0.13ms | -9.90% |

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
| stdev | 0.0048ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0015ms | -8.52% |
| p50 | 0.02ms | 0.02ms | -0.00033ms | -1.90% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -41.22% |
| p99 | 0.03ms | 0.16ms | -0.13ms | -79.93% |
| mean | 0.02ms | 0.03ms | -0.0089ms | -31.89% |
| min | 0.02ms | 0.02ms | -0.0017ms | -10.00% |
| max | 0.03ms | 0.19ms | -0.16ms | -82.45% |
| total | 0.38ms | 0.56ms | -0.18ms | -31.89% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0048ms |
| p50 | 0.0050ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0057ms |
| stdev | 0.0017ms |
| min | 0.0047ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0050ms | -0.00025ms | -4.90% |
| p50 | 0.0050ms | 0.0059ms | -0.00094ms | -15.79% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -87.46% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -91.14% |
| mean | 0.0057ms | 0.02ms | -0.01ms | -69.41% |
| min | 0.0047ms | 0.0050ms | -0.00021ms | -4.20% |
| max | 0.01ms | 0.13ms | -0.12ms | -91.72% |
| total | 0.11ms | 0.37ms | -0.26ms | -69.41% |

