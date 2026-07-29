# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bullmqEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +108448%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +198373%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +198373%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +299401%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.01ms | 10ms | PASS |
| inngestEnvAccessor | 0.01ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -21320 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -616 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | -17640 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 584 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | 912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.21% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +18.54% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.29% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.01ms | -0.01ms | -62.46% |
| total | 0.06ms | 0.07ms | -0.01ms | -10.29% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +166.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +149.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +184.87% |
| mean | 0.00ms | 0.00ms | +0.00ms | +148.79% |
| min | 0.00ms | 0.00ms | +0.00ms | +132.80% |
| max | 0.00ms | 0.00ms | +0.00ms | +193.94% |
| total | 0.07ms | 0.03ms | +0.04ms | +148.79% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +19.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.98% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | -0.00ms | -19.91% |
| total | 0.06ms | 0.05ms | +0.00ms | +1.98% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.81% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.67% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.72% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +47.45% |
| total | 0.05ms | 0.04ms | +0.00ms | +8.72% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -17.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.81% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -13.87% |
| total | 0.03ms | 0.03ms | +0.00ms | +4.81% |

