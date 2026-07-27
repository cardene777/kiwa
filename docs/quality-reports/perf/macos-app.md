# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createMacAppEnv | 0.00ms | 5ms | PASS | stable |
| simulateUserInteraction | 0.00ms | 5ms | PASS | stable |
| captureAccessibilityTree | 0.00ms | 5ms | PASS | improved |
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

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| createMacAppEnv | 697560 B | 0 B | 102400 B | PASS |
| simulateUserInteraction | 263592 B | 0 B | 102400 B | PASS |
| captureAccessibilityTree | 227448 B | 0 B | 102400 B | PASS |
| mockScreencap | 237248 B | 30400 B | 102400 B | PASS |
| emitUserNotification | 210392 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.81% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.33% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.56% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.18% |
| max | 0.02ms | 0.01ms | +0.00ms | +20.65% |
| total | 0.18ms | 0.18ms | -0.00ms | -0.56% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.20% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.77% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.52% |
| total | 0.11ms | 0.12ms | -0.01ms | -5.53% |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -53.46% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +6.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.33% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.07% |
| max | 0.01ms | 0.01ms | +0.00ms | +38.52% |
| total | 0.17ms | 0.22ms | -0.04ms | -19.33% |

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
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.47% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.59% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -6.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.10% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.47% |
| max | 0.02ms | 0.01ms | +0.01ms | +43.19% |
| total | 0.57ms | 0.52ms | +0.05ms | +9.10% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -58.85% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.93% |
| mean | 0.00ms | 0.00ms | -0.00ms | -82.41% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.50ms | -0.49ms | -98.11% |
| total | 0.11ms | 0.60ms | -0.49ms | -82.41% |

