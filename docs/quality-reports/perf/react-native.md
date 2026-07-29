# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createRNTestEnv | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +30730%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| asyncStorageSetGet | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +100000%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| navigate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +62968%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatchLinkingUrl | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +59952%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| setPlatform | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +79466%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createRNTestEnv | 0.02ms | 10ms | PASS |
| asyncStorageSetGet | 0.01ms | 10ms | PASS |
| navigate | 0.01ms | 10ms | PASS |
| dispatchLinkingUrl | 0.02ms | 10ms | PASS |
| setPlatform | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createRNTestEnv | -1480 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | 7448 B | 0 B | 102400 B | yes | PASS |
| navigate | 2656 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 536 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 19456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

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
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +46.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.28% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +107.54% |
| mean | 0.00ms | 0.00ms | +0.00ms | +33.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +50.00% |
| max | 0.02ms | 0.02ms | +0.00ms | +7.94% |
| total | 0.24ms | 0.18ms | +0.06ms | +33.64% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.81% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +20.03% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +24.92% |
| max | 0.00ms | 0.00ms | +0.00ms | +114.94% |
| total | 0.10ms | 0.08ms | +0.01ms | +15.93% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +52.13% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +110.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +24.33% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.01ms | +69.58% |
| total | 0.12ms | 0.10ms | +0.02ms | +24.33% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.81% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +15.21% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.13% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.01ms | +0.00ms | +87.89% |
| total | 0.13ms | 0.11ms | +0.01ms | +12.13% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +19.90% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +26.53% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -13.31% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.22% |
| min | 0.00ms | 0.00ms | +0.00ms | +22.13% |
| max | 0.01ms | 0.01ms | +0.00ms | +50.58% |
| total | 0.12ms | 0.11ms | +0.02ms | +14.22% |

