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
| createRNTestEnv | -7496 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -576 B | 0 B | 102400 B | yes | PASS |
| navigate | -416 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | -560 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 104 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.19% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -67.59% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -56.73% |
| mean | 0.00ms | 0.00ms | -0.00ms | -32.46% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.02ms | 0.03ms | -0.01ms | -36.55% |
| total | 0.18ms | 0.27ms | -0.09ms | -32.46% |

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
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.60% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +31.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +33.75% |
| min | 0.00ms | 0.00ms | +0.00ms | +24.92% |
| max | 0.02ms | 0.00ms | +0.01ms | +669.77% |
| total | 0.11ms | 0.08ms | +0.03ms | +33.75% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +77.69% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.75% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.57% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +2.76% |
| total | 0.10ms | 0.10ms | +0.00ms | +2.57% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.01% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -16.59% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.79% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.01ms | 0.01ms | +0.00ms | +72.66% |
| total | 0.12ms | 0.12ms | -0.00ms | -3.79% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.33% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -49.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.83% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.84% |
| total | 0.11ms | 0.11ms | -0.00ms | -1.83% |

