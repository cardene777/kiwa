# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

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
| stateMachineInvoke | -1624 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -528 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 36688 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 96960 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +30.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.07% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +21.86% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.00% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.01ms | +80.53% |
| total | 0.35ms | 0.30ms | +0.04ms | +14.00% |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.88% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +30.21% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +141.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.07% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.10% |
| max | 0.01ms | 0.01ms | +0.00ms | +45.84% |
| total | 0.26ms | 0.23ms | +0.03ms | +11.07% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.78% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +62.81% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +53.14% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.07% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.90% |
| total | 0.11ms | 0.09ms | +0.02ms | +20.07% |

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
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +54.44% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +144.13% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.34% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| max | 0.02ms | 0.02ms | -0.00ms | -9.92% |
| total | 0.13ms | 0.12ms | +0.01ms | +7.34% |

