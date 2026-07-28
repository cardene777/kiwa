# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createMacAppEnv | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +26578%) 以上の悪化が必要) |
| simulateUserInteraction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +74605%) 以上の悪化が必要) |
| captureAccessibilityTree | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +47794%) 以上の悪化が必要) |
| mockScreencap | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +12103%) 以上の悪化が必要) |
| emitUserNotification | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +119318%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.02ms | 10ms | PASS |
| simulateUserInteraction | 0.08ms | 10ms | PASS |
| captureAccessibilityTree | 0.01ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -640 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 31168 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -2496 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 712 B | 0 B | 102400 B | yes | PASS |
| emitUserNotification | 32944 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.02% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +22.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.15% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +19.57% |
| total | 0.18ms | 0.16ms | +0.02ms | +13.15% |

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
| max | 0.00ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.22% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.67% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.55% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +5.31% |
| total | 0.11ms | 0.11ms | +0.00ms | +1.55% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.11ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +83.84% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +139.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +84.82% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.11ms | 0.01ms | +0.11ms | +1735.38% |
| total | 0.31ms | 0.17ms | +0.14ms | +84.82% |

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
| max | 0.01ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.71% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.94% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +68.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.39% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.12% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.25% |
| total | 0.53ms | 0.52ms | +0.01ms | +1.39% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.31% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +5.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.08% |
| total | 0.09ms | 0.09ms | +0.00ms | +2.14% |

