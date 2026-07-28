# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| executeWorkflow | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +25528%) 以上の悪化が必要) |
| defineWorkflow | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +133333%) 以上の悪化が必要) |
| retryStepSucceed | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +31319%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.01ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 81808 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -16232 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 616 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.06% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.37% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -18.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.39% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.14% |
| total | 0.22ms | 0.24ms | -0.02ms | -8.70% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.13% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -15.02% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.26% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.48% |
| max | 0.00ms | 0.01ms | -0.00ms | -37.75% |
| total | 0.06ms | 0.07ms | -0.01ms | -14.26% |

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
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -35.92% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +23.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.24% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.13% |
| max | 0.02ms | 0.01ms | +0.01ms | +65.13% |
| total | 0.13ms | 0.13ms | +0.00ms | +1.24% |

