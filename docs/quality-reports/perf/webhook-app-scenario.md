# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0049ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.19ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -1760 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 384 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.0060ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0011ms | -2.20% |
| p50 | 0.06ms | 0.06ms | -0.0084ms | -13.03% |
| p95 | 0.06ms | 0.08ms | -0.01ms | -18.92% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -21.02% |
| mean | 0.06ms | 0.07ms | -0.0088ms | -13.53% |
| min | 0.05ms | 0.05ms | -0.0015ms | -3.08% |
| max | 0.07ms | 0.10ms | -0.02ms | -21.44% |
| total | 1.13ms | 1.31ms | -0.18ms | -13.53% |

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
| stdev | 0.0043ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -6.17% |
| p50 | 0.02ms | 0.02ms | -0.000062ms | -0.35% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -45.14% |
| p99 | 0.03ms | 0.16ms | -0.13ms | -80.54% |
| mean | 0.02ms | 0.03ms | -0.0085ms | -30.57% |
| min | 0.02ms | 0.02ms | -0.0012ms | -7.08% |
| max | 0.03ms | 0.19ms | -0.16ms | -82.85% |
| total | 0.39ms | 0.56ms | -0.17ms | -30.57% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0052ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0059ms |
| stdev | 0.0018ms |
| min | 0.0047ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0050ms | -0.00016ms | -3.23% |
| p50 | 0.0052ms | 0.0059ms | -0.00077ms | -12.99% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -86.92% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -90.87% |
| mean | 0.0059ms | 0.02ms | -0.01ms | -68.26% |
| min | 0.0047ms | 0.0050ms | -0.00025ms | -5.02% |
| max | 0.01ms | 0.13ms | -0.12ms | -91.50% |
| total | 0.12ms | 0.37ms | -0.25ms | -68.26% |

