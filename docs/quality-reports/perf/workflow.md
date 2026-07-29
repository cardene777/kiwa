# Perf Suite — workflow

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| executeWorkflow | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +25528%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| defineWorkflow | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +133333%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStepSucceed | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +31319%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| executeWorkflow | 0.04ms | 10ms | PASS |
| defineWorkflow | 0.01ms | 10ms | PASS |
| retryStepSucceed | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| executeWorkflow | 91392 B | 0 B | 102400 B | yes | PASS |
| defineWorkflow | -11552 B | 0 B | 102400 B | yes | PASS |
| retryStepSucceed | 712 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +51.77% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +21.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.11% |
| min | 0.00ms | 0.00ms | -0.00ms | -21.09% |
| max | 0.02ms | 0.01ms | +0.01ms | +41.37% |
| total | 0.25ms | 0.24ms | +0.01ms | +6.11% |

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
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.30% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.76% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.48% |
| max | 0.00ms | 0.01ms | -0.00ms | -38.47% |
| total | 0.07ms | 0.07ms | -0.00ms | -6.76% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.07% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -2.27% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.71% |
| total | 0.14ms | 0.13ms | +0.01ms | +8.93% |

