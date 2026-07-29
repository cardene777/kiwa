# Perf Suite — webhook-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.06ms | 0.09ms | 100ms | 0.00050ms | PASS | stable (p10 +11% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatch_retry_batch (5 handler retry with backoff) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| signature_reject_error (5 invalid signature detect) | 0.0057ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 0.25ms | 200ms | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 0.11ms | 200ms | PASS |
| signature_reject_error (5 invalid signature detect) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verify_workflow (10 verify across 4 providers) | 1208 B | -54036 B | 102400 B | yes | PASS |
| dispatch_retry_batch (5 handler retry with backoff) | 448 B | 0 B | 102400 B | yes | PASS |
| signature_reject_error (5 invalid signature detect) | -7216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verify_workflow (10 verify across 4 providers)

# Perf Report — verify_workflow (10 verify across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.12ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.0057ms | +11.04% |
| p50 | 0.07ms | 0.06ms | +0.0065ms | +9.97% |
| p95 | 0.09ms | 0.08ms | +0.02ms | +20.83% |
| p99 | 0.11ms | 0.09ms | +0.02ms | +20.87% |
| mean | 0.07ms | 0.07ms | +0.0085ms | +13.04% |
| min | 0.06ms | 0.05ms | +0.0069ms | +13.75% |
| max | 0.12ms | 0.10ms | +0.02ms | +20.87% |
| total | 1.48ms | 1.31ms | +0.17ms | +13.04% |

### dispatch_retry_batch (5 handler retry with backoff)

# Perf Report — dispatch_retry_batch (5 handler retry with backoff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0014ms | -8.04% |
| p50 | 0.02ms | 0.02ms | +0.00027ms | +1.55% |
| p95 | 0.04ms | 0.05ms | -0.0092ms | -18.59% |
| p99 | 0.05ms | 0.16ms | -0.11ms | -66.94% |
| mean | 0.02ms | 0.03ms | -0.0060ms | -21.77% |
| min | 0.01ms | 0.02ms | -0.0024ms | -14.15% |
| max | 0.06ms | 0.19ms | -0.13ms | -70.08% |
| total | 0.43ms | 0.56ms | -0.12ms | -21.77% |

### signature_reject_error (5 invalid signature detect)

# Perf Report — signature_reject_error (5 invalid signature detect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0022ms |
| min | 0.0057ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0050ms | +0.00071ms | +14.15% |
| p50 | 0.0059ms | 0.0059ms | +5.0e-7ms | +0.01% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -87.45% |
| p99 | 0.01ms | 0.12ms | -0.11ms | -88.37% |
| mean | 0.0069ms | 0.02ms | -0.01ms | -62.80% |
| min | 0.0057ms | 0.0050ms | +0.00075ms | +15.13% |
| max | 0.02ms | 0.13ms | -0.12ms | -88.51% |
| total | 0.14ms | 0.37ms | -0.23ms | -62.80% |

