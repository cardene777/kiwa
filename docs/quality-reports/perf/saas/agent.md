# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stateMachineInvoke | 0.00ms | 5ms | PASS | stable |
| stateGraphInvoke | 0.00ms | 5ms | PASS | stable |
| assistantsCreateThread | 0.00ms | 5ms | PASS | regressed |
| assistantsAddMessage | 0.00ms | 5ms | PASS | regressed |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.03ms | 10ms | PASS |
| stateGraphInvoke | 0.05ms | 10ms | PASS |
| assistantsCreateThread | 0.02ms | 10ms | PASS |
| assistantsAddMessage | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| stateMachineInvoke | 1305296 B | 0 B | 102400 B | PASS |
| stateGraphInvoke | 506568 B | 0 B | 102400 B | PASS |
| assistantsCreateThread | 195696 B | 0 B | 102400 B | PASS |
| assistantsAddMessage | 272424 B | 0 B | 102400 B | PASS |

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
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +75.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.02% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +43.94% |
| mean | 0.00ms | 0.00ms | +0.00ms | +54.16% |
| min | 0.00ms | 0.00ms | +0.00ms | +81.68% |
| max | 0.01ms | 0.01ms | +0.00ms | +50.75% |
| total | 0.41ms | 0.27ms | +0.14ms | +54.16% |

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
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +30.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.98% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -38.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.37% |
| max | 0.01ms | 0.04ms | -0.03ms | -77.50% |
| total | 0.33ms | 0.32ms | +0.01ms | +3.25% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +161.98% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +400.17% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +135.08% |
| mean | 0.00ms | 0.00ms | +0.00ms | +179.47% |
| min | 0.00ms | 0.00ms | +0.00ms | +157.73% |
| max | 0.01ms | 0.00ms | +0.01ms | +138.82% |
| total | 0.23ms | 0.08ms | +0.15ms | +179.47% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +166.67% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +666.60% |
| p99 | 0.03ms | 0.00ms | +0.03ms | +1819.91% |
| mean | 0.00ms | 0.00ms | +0.00ms | +376.61% |
| min | 0.00ms | 0.00ms | +0.00ms | +137.54% |
| max | 0.07ms | 0.01ms | +0.07ms | +1205.19% |
| total | 0.44ms | 0.09ms | +0.35ms | +376.61% |

