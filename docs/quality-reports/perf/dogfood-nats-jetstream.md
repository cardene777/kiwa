# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0072ms | 0.02ms | 80ms | 0.00083ms | PASS | regressed — gate 無効 (regressionGate=false) |
| driveKV | 0.0038ms | 0.0063ms | 80ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.04ms | 80ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.02ms | 80ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.35ms | 160ms | PASS |
| driveKV | 0.12ms | 160ms | PASS |
| driveObject | 0.17ms | 160ms | PASS |
| driveRouting | 0.24ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -13776 B | 0 B | 102400 B | yes | PASS |
| driveKV | -5408 B | 0 B | 102400 B | yes | PASS |
| driveObject | -13872 B | 39229 B | 102400 B | yes | PASS |
| driveRouting | -2296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0072ms |
| p50 | 0.0077ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0095ms |
| stdev | 0.0060ms |
| min | 0.0068ms |
| max | 0.06ms |
| total | 1.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0055ms | +0.0017ms | +31.31% |
| p50 | 0.0077ms | 0.0064ms | +0.0013ms | +20.12% |
| p95 | 0.02ms | 0.01ms | +0.0054ms | +41.32% |
| p99 | 0.04ms | 0.03ms | +0.0052ms | +16.47% |
| mean | 0.0095ms | 0.0075ms | +0.0020ms | +26.75% |
| min | 0.0068ms | 0.0053ms | +0.0015ms | +29.14% |
| max | 0.06ms | 0.04ms | +0.01ms | +35.02% |
| total | 1.91ms | 1.50ms | +0.40ms | +26.75% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0038ms |
| p50 | 0.0040ms |
| p95 | 0.0063ms |
| p99 | 0.02ms |
| mean | 0.0054ms |
| stdev | 0.01ms |
| min | 0.0037ms |
| max | 0.17ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0034ms | +0.00042ms | +12.17% |
| p50 | 0.0040ms | 0.0035ms | +0.00046ms | +12.93% |
| p95 | 0.0063ms | 0.0061ms | +0.00013ms | +2.08% |
| p99 | 0.02ms | 0.02ms | +0.0032ms | +19.36% |
| mean | 0.0054ms | 0.0041ms | +0.0013ms | +32.66% |
| min | 0.0037ms | 0.0034ms | +0.00037ms | +11.11% |
| max | 0.17ms | 0.02ms | +0.15ms | +753.96% |
| total | 1.09ms | 0.82ms | +0.27ms | +32.66% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 3.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.010ms | +0.0012ms | +11.71% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +10.51% |
| p95 | 0.04ms | 0.03ms | +0.0048ms | +15.71% |
| p99 | 0.07ms | 0.04ms | +0.02ms | +54.72% |
| mean | 0.02ms | 0.01ms | +0.0037ms | +24.92% |
| min | 0.01ms | 0.0095ms | +0.0011ms | +11.84% |
| max | 0.18ms | 0.05ms | +0.13ms | +278.50% |
| total | 3.69ms | 2.95ms | +0.74ms | +24.92% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.22ms |
| total | 3.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0012ms | +10.58% |
| p50 | 0.01ms | 0.01ms | +0.0012ms | +9.92% |
| p95 | 0.02ms | 0.02ms | +0.0034ms | +15.64% |
| p99 | 0.04ms | 0.03ms | +0.0063ms | +21.43% |
| mean | 0.02ms | 0.01ms | +0.0023ms | +15.97% |
| min | 0.01ms | 0.01ms | +0.0012ms | +10.90% |
| max | 0.22ms | 0.11ms | +0.12ms | +110.08% |
| total | 3.29ms | 2.84ms | +0.45ms | +15.97% |

