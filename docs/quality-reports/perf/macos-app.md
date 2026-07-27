# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createMacAppEnv | 0.00ms | 5ms | PASS | stable |
| simulateUserInteraction | 0.00ms | 5ms | PASS | stable |
| captureAccessibilityTree | 0.00ms | 5ms | PASS | stable |
| mockScreencap | 0.00ms | 5ms | PASS | stable |
| emitUserNotification | 0.00ms | 5ms | PASS | stable |

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
| createMacAppEnv | -5336 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 31464 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | 664 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 832 B | -22344 B | 102400 B | yes | PASS |
| emitUserNotification | 33144 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.17% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.02% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.14% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +30.98% |
| total | 0.18ms | 0.16ms | +0.02ms | +11.14% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

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
| max | 0.09ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.43% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +116.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +101.57% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| max | 0.09ms | 0.00ms | +0.09ms | +2099.04% |
| total | 0.22ms | 0.11ms | +0.11ms | +101.57% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.59% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.26% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +8.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.67% |
| total | 0.19ms | 0.19ms | +0.01ms | +3.03% |

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
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.16% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.00% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -12.71% |
| mean | 0.00ms | 0.00ms | -0.00ms | -13.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.38% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.77% |
| total | 0.50ms | 0.58ms | -0.08ms | -13.14% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -37.17% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +2.17% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.14% |
| total | 0.10ms | 0.11ms | -0.01ms | -11.07% |

