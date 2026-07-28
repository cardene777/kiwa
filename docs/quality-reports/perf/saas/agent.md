# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stateMachineInvoke | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +12500%) 以上の悪化が必要) |
| stateGraphInvoke | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +33241%) 以上の悪化が必要) |
| assistantsCreateThread | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +56606%) 以上の悪化が必要) |
| assistantsAddMessage | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +56208%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.03ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | -5256 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -15136 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 37416 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 100400 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.36% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.59% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.59% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.03% |
| max | 0.02ms | 0.01ms | +0.00ms | +5.42% |
| total | 0.38ms | 0.33ms | +0.06ms | +17.59% |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.11% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.21% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +115.66% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.27% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.07% |
| max | 0.01ms | 0.01ms | +0.00ms | +5.98% |
| total | 0.29ms | 0.26ms | +0.03ms | +10.27% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.93% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +65.11% |
| mean | 0.00ms | 0.00ms | +0.00ms | +25.94% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.30% |
| max | 0.01ms | 0.01ms | +0.00ms | +35.39% |
| total | 0.13ms | 0.11ms | +0.03ms | +25.94% |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +27.87% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +9.47% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.97% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.02ms | 0.02ms | -0.01ms | -26.48% |
| total | 0.16ms | 0.15ms | +0.01ms | +3.97% |

