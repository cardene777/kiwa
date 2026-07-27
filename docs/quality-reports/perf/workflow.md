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
| executeWorkflow | 85096 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -400 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | -12896 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.16% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +20.58% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -5.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.08% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.99% |
| max | 0.01ms | 0.01ms | -0.00ms | -30.55% |
| total | 0.20ms | 0.22ms | -0.02ms | -8.08% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -58.59% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -67.26% |
| mean | 0.00ms | 0.00ms | -0.00ms | -65.19% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.00ms | 0.03ms | -0.03ms | -88.92% |
| total | 0.06ms | 0.17ms | -0.11ms | -65.19% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.89% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.88% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +8.61% |
| total | 0.12ms | 0.11ms | +0.01ms | +11.88% |

