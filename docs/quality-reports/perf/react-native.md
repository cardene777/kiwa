# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createRNTestEnv | 0.00ms | 5ms | PASS | stable |
| asyncStorageSetGet | 0.00ms | 5ms | PASS | stable |
| navigate | 0.00ms | 5ms | PASS | stable |
| dispatchLinkingUrl | 0.00ms | 5ms | PASS | improved |
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

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| createRNTestEnv | 552640 B | 0 B | 102400 B | PASS |
| asyncStorageSetGet | 474160 B | 0 B | 102400 B | PASS |
| navigate | 408472 B | 0 B | 102400 B | PASS |
| dispatchLinkingUrl | 629376 B | 0 B | 102400 B | PASS |
| setPlatform | 559088 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.31% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +46.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.32% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.10% |
| max | 0.02ms | 0.02ms | +0.00ms | +31.90% |
| total | 0.18ms | 0.17ms | +0.01ms | +8.32% |

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
| max | 0.00ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.45% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.17% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.17% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.00ms | 0.00ms | +0.00ms | +39.05% |
| total | 0.09ms | 0.08ms | +0.00ms | +5.17% |

### navigate

# Perf Report — navigate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +62.33% |
| p99 | 0.02ms | 0.00ms | +0.01ms | +377.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +74.12% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.04% |
| max | 0.03ms | 0.01ms | +0.02ms | +330.86% |
| total | 0.20ms | 0.12ms | +0.09ms | +74.12% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -65.87% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +14.50% |
| mean | 0.00ms | 0.00ms | -0.00ms | -23.39% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +21.43% |
| total | 0.11ms | 0.15ms | -0.03ms | -23.39% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.33% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -18.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +23.78% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.00ms | +0.01ms | +203.38% |
| total | 0.12ms | 0.10ms | +0.02ms | +23.78% |

