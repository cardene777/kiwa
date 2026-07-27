# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createRNTestEnv | 0.00ms | 5ms | PASS | stable |
| asyncStorageSetGet | 0.00ms | 5ms | PASS | stable |
| navigate | 0.00ms | 5ms | PASS | stable |
| dispatchLinkingUrl | 0.00ms | 5ms | PASS | stable |
| setPlatform | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.01ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.01ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | -4312 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -176 B | 0 B | 102400 B | yes | PASS |
| navigate | 800 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 944 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 1144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.38% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -69.48% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -16.47% |
| mean | 0.00ms | 0.00ms | -0.00ms | -30.40% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.02ms | 0.03ms | -0.01ms | -30.51% |
| total | 0.19ms | 0.27ms | -0.08ms | -30.40% |

### asyncStorageSetGet

# Perf Report — asyncStorageSetGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.41% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.53% |
| mean | 0.00ms | 0.00ms | +0.00ms | +86.19% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.07ms | 0.00ms | +0.07ms | +3318.91% |
| total | 0.16ms | 0.08ms | +0.07ms | +86.19% |

### navigate

# Perf Report — navigate.serial

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
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +37.03% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +63.45% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.02ms | 0.01ms | +0.01ms | +68.81% |
| total | 0.10ms | 0.10ms | +0.00ms | +4.60% |

### dispatchLinkingUrl

# Perf Report — dispatchLinkingUrl.serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.34% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -15.33% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -10.96% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.29% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.01ms | 0.01ms | +0.00ms | +61.34% |
| total | 0.11ms | 0.12ms | -0.01ms | -10.29% |

### setPlatform

# Perf Report — setPlatform.serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.53% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -16.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.99% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +20.09% |
| total | 0.11ms | 0.11ms | +0.00ms | +3.99% |

