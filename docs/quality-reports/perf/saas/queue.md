# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

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
| inngestEnvAccessor | 0.00ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| bullmqEnvAccessor | -213072 B | 0 B | 102400 B | yes | PASS |
| inngestEnvAccessor | -2488 B | 0 B | 102400 B | yes | PASS |
| cloudflareQueuesEnvAccessor | -17360 B | 0 B | 102400 B | yes | PASS |
| sqsEnvAccessor | -112 B | 0 B | 102400 B | yes | PASS |
| rabbitmqEnvAccessor | 664 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +282.93% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +9.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +19.72% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.92% |
| total | 0.08ms | 0.06ms | +0.01ms | +19.72% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +33.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.23% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +30.87% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.09% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +40.00% |
| total | 0.03ms | 0.03ms | +0.00ms | +16.09% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.82% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +53.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.45% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.60% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.89% |
| total | 0.06ms | 0.05ms | +0.01ms | +13.45% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -0.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.62% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.00ms | 0.00ms | +0.00ms | +52.83% |
| total | 0.04ms | 0.04ms | +0.00ms | +1.62% |

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
| max | 0.02ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +52.66% |
| mean | 0.00ms | 0.00ms | +0.00ms | +47.20% |
| min | 0.00ms | 0.00ms | +0.00ms | +50.60% |
| max | 0.02ms | 0.00ms | +0.01ms | +746.37% |
| total | 0.05ms | 0.03ms | +0.01ms | +47.20% |

