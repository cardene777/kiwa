# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bullmqEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +108448%) 以上の悪化が必要) |
| inngestEnvAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| cloudflareQueuesEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +198373%) 以上の悪化が必要) |
| sqsEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +198373%) 以上の悪化が必要) |
| rabbitmqEnvAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |

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
| bullmqEnvAccessor | 152392 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -16336 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 888 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 680 B | 0 B | 102400 B | yes | PASS |
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
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +171.12% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.85% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.01ms | 0.01ms | +0.00ms | +16.18% |
| total | 0.07ms | 0.07ms | +0.01ms | +12.85% |

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
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +26.38% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.38% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.60% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| total | 0.03ms | 0.03ms | +0.00ms | +12.60% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.85% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.98% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.32% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | -0.00ms | -24.88% |
| total | 0.06ms | 0.05ms | +0.00ms | +8.32% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.47% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -5.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.16% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +30.77% |
| total | 0.05ms | 0.04ms | +0.00ms | +10.16% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +49.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +81.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.60% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| total | 0.04ms | 0.03ms | +0.01ms | +18.60% |

