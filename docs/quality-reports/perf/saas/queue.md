# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| bullmqEnvAccessor | 0.00ms | 5ms | PASS | stable |
| inngestEnvAccessor | 0.00ms | 5ms | PASS | stable |
| cloudflareQueuesEnvAccessor | 0.00ms | 5ms | PASS | stable |
| sqsEnvAccessor | 0.00ms | 5ms | PASS | stable |
| rabbitmqEnvAccessor | 0.00ms | 5ms | PASS | stable |

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
| bullmqEnvAccessor | -15792 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -544 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | 1088 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | 880 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | -328 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.61% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -6.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.31% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.02ms | 0.01ms | +0.00ms | +11.55% |
| total | 0.06ms | 0.06ms | +0.00ms | +2.31% |

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
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.52% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.01% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +26.72% |
| total | 0.03ms | 0.03ms | -0.00ms | -0.01% |

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
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +424.52% |
| mean | 0.00ms | 0.00ms | +0.00ms | +47.20% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +153.33% |
| total | 0.08ms | 0.05ms | +0.02ms | +47.20% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +12.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.37% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.00ms | 0.00ms | +0.00ms | +29.96% |
| total | 0.04ms | 0.04ms | +0.00ms | +0.37% |

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
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +41.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +43.62% |
| min | 0.00ms | 0.00ms | +0.00ms | +50.60% |
| max | 0.01ms | 0.00ms | +0.01ms | +711.50% |
| total | 0.04ms | 0.03ms | +0.01ms | +43.62% |

