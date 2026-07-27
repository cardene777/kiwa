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
| executeWorkflow | 0.02ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 90552 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -16168 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.04% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.38% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.50% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.96% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.30% |
| max | 0.01ms | 0.01ms | -0.01ms | -46.39% |
| total | 0.20ms | 0.22ms | -0.02ms | -6.96% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -53.44% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -53.11% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -58.68% |
| mean | 0.00ms | 0.00ms | -0.00ms | -60.56% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.00ms | 0.03ms | -0.03ms | -87.47% |
| total | 0.07ms | 0.17ms | -0.10ms | -60.56% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +68.47% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +21.78% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.18% |
| total | 0.13ms | 0.11ms | +0.02ms | +21.78% |

