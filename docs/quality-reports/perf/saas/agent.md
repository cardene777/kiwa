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
| stateMachineInvoke | -128144 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -544 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 37616 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 96992 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.72% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +14.67% |
| total | 0.32ms | 0.30ms | +0.01ms | +4.06% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.76% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +117.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.90% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.26% |
| total | 0.24ms | 0.23ms | +0.00ms | +1.90% |

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
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.78% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +58.23% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +49.48% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.87% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +59.76% |
| total | 0.11ms | 0.09ms | +0.02ms | +20.87% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +59.19% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +145.81% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.59% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.02ms | -0.01ms | -30.58% |
| total | 0.13ms | 0.12ms | +0.00ms | +2.59% |

