# Perf Suite — react-native

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createRNTestEnv | 0.01ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| asyncStorageSetGet | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +100000%) 以上の悪化が必要) |
| navigate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +62968%) 以上の悪化が必要) |
| dispatchLinkingUrl | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +59952%) 以上の悪化が必要) |
| setPlatform | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |

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
| createRNTestEnv | -6752 B | 0 B | 102400 B | yes | PASS |
| asyncStorageSetGet | -5168 B | 0 B | 102400 B | yes | PASS |
| navigate | 6656 B | 0 B | 102400 B | yes | PASS |
| dispatchLinkingUrl | 1096 B | 0 B | 102400 B | yes | PASS |
| setPlatform | 848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createRNTestEnv

# Perf Report — createRNTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.20ms |
| mean | 0.01ms |
| stdev | 0.06ms |
| min | 0.00ms |
| max | 0.79ms |
| total | 1.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.00ms | +0.01ms | +784.67% |
| p99 | 0.20ms | 0.01ms | +0.19ms | +2639.76% |
| mean | 0.01ms | 0.00ms | +0.01ms | +937.14% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.79ms | 0.02ms | +0.77ms | +3763.20% |
| total | 1.90ms | 0.18ms | +1.72ms | +937.14% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +36.13% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.95% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.00ms | 0.00ms | +0.00ms | +42.47% |
| total | 0.09ms | 0.08ms | +0.00ms | +2.95% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.26% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +22.04% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.57% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.01ms | -0.00ms | -17.53% |
| total | 0.10ms | 0.10ms | +0.00ms | +1.57% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.78% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -13.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.72% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +60.62% |
| total | 0.12ms | 0.11ms | +0.00ms | +2.72% |

### setPlatform

# Perf Report — setPlatform.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.05ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +240.05% |
| p99 | 0.05ms | 0.00ms | +0.05ms | +1536.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +285.94% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.01ms | +0.08ms | +1077.59% |
| total | 0.41ms | 0.11ms | +0.31ms | +285.94% |

