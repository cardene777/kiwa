# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stateMachineInvoke | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +12500%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.01ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +56606%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +56208%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| stateMachineInvoke | 1136 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | 10968 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 40872 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 106320 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +28.53% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.87% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.49% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.36% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.14% |
| total | 0.35ms | 0.33ms | +0.03ms | +8.36% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.06ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.17ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.51% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +302.93% |
| p99 | 0.06ms | 0.00ms | +0.05ms | +1791.98% |
| mean | 0.00ms | 0.00ms | +0.00ms | +196.28% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.17ms | 0.01ms | +0.16ms | +1210.06% |
| total | 0.77ms | 0.26ms | +0.51ms | +196.28% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.87% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +32.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.68% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +2.87% |
| total | 0.11ms | 0.11ms | +0.00ms | +3.68% |

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
| max | 0.05ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.89% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +126.03% |
| mean | 0.00ms | 0.00ms | +0.00ms | +30.95% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.05ms | 0.02ms | +0.02ms | +84.48% |
| total | 0.20ms | 0.15ms | +0.05ms | +30.95% |

