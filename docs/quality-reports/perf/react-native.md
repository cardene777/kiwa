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
| createRNTestEnv | -5528 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | 2824 B | 0 B | 102400 B | yes | PASS |
| navigate | -14840 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 816 B | 0 B | 102400 B | yes | PASS |
| setPlatform | -169192 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.19% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -70.43% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -56.65% |
| mean | 0.00ms | 0.00ms | -0.00ms | -30.64% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.02ms | 0.03ms | -0.01ms | -33.10% |
| total | 0.19ms | 0.27ms | -0.08ms | -30.64% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.83% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +86.83% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.07ms | 0.00ms | +0.07ms | +3360.89% |
| total | 0.16ms | 0.08ms | +0.07ms | +86.83% |

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
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +61.22% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +20.60% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.39% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.13% |
| total | 0.10ms | 0.10ms | +0.00ms | +0.39% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -22.92% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.28% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -25.00% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.61% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.01ms | 0.01ms | +0.01ms | +92.00% |
| total | 0.11ms | 0.12ms | -0.01ms | -11.61% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.01% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -40.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.28% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +17.95% |
| total | 0.11ms | 0.11ms | +0.00ms | +4.28% |

