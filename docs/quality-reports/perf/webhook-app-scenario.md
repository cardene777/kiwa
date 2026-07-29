# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0057ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.21ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.08ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | -184216 B | 0 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 648 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | 392 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0058ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00028ms | -0.54% |
| p50 | 0.06ms | 0.06ms | -0.0061ms | -9.46% |
| p95 | 0.07ms | 0.08ms | -0.01ms | -14.70% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -22.66% |
| mean | 0.06ms | 0.07ms | -0.0064ms | -9.77% |
| min | 0.05ms | 0.05ms | -0.00033ms | -0.67% |
| max | 0.07ms | 0.10ms | -0.02ms | -24.28% |
| total | 1.18ms | 1.31ms | -0.13ms | -9.77% |

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
| stdev | 0.0036ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00063ms | -3.67% |
| p50 | 0.02ms | 0.02ms | +0.00013ms | +0.72% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -45.75% |
| p99 | 0.03ms | 0.16ms | -0.13ms | -81.61% |
| mean | 0.02ms | 0.03ms | -0.0087ms | -31.41% |
| min | 0.02ms | 0.02ms | -0.00062ms | -3.66% |
| max | 0.03ms | 0.19ms | -0.16ms | -83.94% |
| total | 0.38ms | 0.56ms | -0.17ms | -31.41% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0061ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0022ms |
| min | 0.0055ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0050ms | +0.00067ms | +13.25% |
| p50 | 0.0061ms | 0.0059ms | +0.00021ms | +3.51% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -84.83% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -89.14% |
| mean | 0.0070ms | 0.02ms | -0.01ms | -62.05% |
| min | 0.0055ms | 0.0050ms | +0.00050ms | +10.08% |
| max | 0.01ms | 0.13ms | -0.12ms | -89.82% |
| total | 0.14ms | 0.37ms | -0.23ms | -62.05% |

