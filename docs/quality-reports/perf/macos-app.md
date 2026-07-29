# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createMacAppEnv | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +26578%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +74605%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +47794%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mockScreencap | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +12103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +119318%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.01ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.02ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -6064 B | -74450 B | 102400 B | yes | PASS |
| simulateUserInteraction | 34552 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | 3440 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 712 B | -82840 B | 102400 B | yes | PASS |
| emitUserNotification | 23560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.31% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -33.44% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.94% |
| min | 0.00ms | 0.00ms | +0.00ms | +55.47% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.70% |
| total | 0.17ms | 0.16ms | +0.02ms | +10.94% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +18.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +59.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.37% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.01ms | 0.00ms | +0.00ms | +15.91% |
| total | 0.13ms | 0.11ms | +0.02ms | +18.37% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.71% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.95% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.24% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.18% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +37.57% |
| total | 0.19ms | 0.17ms | +0.02ms | +12.18% |

### mockScreencap

# Perf Report — mockScreencap.serial

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
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +18.63% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.12% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +30.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.13% |
| min | 0.00ms | 0.00ms | +0.00ms | +15.01% |
| max | 0.02ms | 0.01ms | +0.00ms | +38.01% |
| total | 0.58ms | 0.52ms | +0.06ms | +11.13% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +39.63% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +20.52% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.57% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +32.05% |
| total | 0.10ms | 0.09ms | +0.01ms | +16.57% |

