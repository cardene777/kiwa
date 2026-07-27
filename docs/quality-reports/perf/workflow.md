# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| executeWorkflow | 0.00ms | 5ms | PASS | stable |
| defineWorkflow | 0.00ms | 5ms | PASS | stable |
| retryStepSucceed | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.01ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 89608 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -576 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | -312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### executeWorkflow

# Perf Report — executeWorkflow.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.99% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.38% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.17% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.30% |
| max | 0.01ms | 0.01ms | -0.00ms | -29.17% |
| total | 0.19ms | 0.22ms | -0.03ms | -12.87% |

### defineWorkflow

# Perf Report — defineWorkflow.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -60.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -59.01% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -71.26% |
| mean | 0.00ms | 0.00ms | -0.00ms | -64.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.00ms | 0.03ms | -0.03ms | -88.26% |
| total | 0.06ms | 0.17ms | -0.11ms | -64.92% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +23.50% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +38.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.99% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.18% |
| total | 0.12ms | 0.11ms | +0.01ms | +4.99% |

