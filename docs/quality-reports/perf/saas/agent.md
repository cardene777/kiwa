# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stateMachineInvoke | 0.00ms | 5ms | PASS | stable |
| stateGraphInvoke | 0.00ms | 5ms | PASS | stable |
| assistantsCreateThread | 0.00ms | 5ms | PASS | stable |
| assistantsAddMessage | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.02ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | -19696 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -544 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 37712 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 95520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

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
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.78% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.63% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.63% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.38% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.57% |
| total | 0.32ms | 0.30ms | +0.02ms | +5.63% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.79% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.05% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +129.83% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.01% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +15.11% |
| total | 0.24ms | 0.23ms | +0.00ms | +2.01% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.78% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +49.77% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +60.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.50% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +117.15% |
| total | 0.11ms | 0.09ms | +0.02ms | +17.50% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.63% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +144.62% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.64% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.02ms | -0.01ms | -35.54% |
| total | 0.13ms | 0.12ms | +0.00ms | +0.64% |

