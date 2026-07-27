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
| defineWorkflow | 0.02ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| executeWorkflow | 582248 B | 0 B | 102400 B | PASS |
| defineWorkflow | 198824 B | 0 B | 102400 B | PASS |
| retryStepSucceed | 121984 B | 0 B | 102400 B | PASS |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +17.80% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -15.32% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +1.76% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.50% |
| min | 0.00ms | 0.00ms | +0.00ms | +35.68% |
| max | 0.01ms | 0.01ms | +0.00ms | +45.83% |
| total | 0.21ms | 0.19ms | +0.02ms | +11.50% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -73.14% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -31.75% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.07% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +1.06% |
| total | 0.07ms | 0.07ms | -0.00ms | -2.07% |

### retryStepSucceed

# Perf Report — retryStepSucceed.serial

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -23.53% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +24.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.29% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +61.76% |
| total | 0.13ms | 0.13ms | +0.01ms | +4.29% |

