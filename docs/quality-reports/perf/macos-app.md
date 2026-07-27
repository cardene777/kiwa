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
| captureAccessibilityTree | 0.01ms | 10ms | PASS |
| mockScreencap | 0.02ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -4112 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 15808 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -2296 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 912 B | -16416 B | 102400 B | yes | PASS |
| emitUserNotification | 33048 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.03% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.76% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.35% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +15.81% |
| total | 0.16ms | 0.16ms | +0.00ms | +2.35% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.52% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -10.81% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.97% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.24% |
| max | 0.00ms | 0.00ms | +0.00ms | +4.89% |
| total | 0.10ms | 0.11ms | -0.01ms | -5.97% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.36% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.47% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -2.39% |
| total | 0.18ms | 0.19ms | -0.01ms | -6.47% |

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
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.10% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.75% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -20.68% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.43% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.66% |
| max | 0.01ms | 0.01ms | -0.00ms | -2.84% |
| total | 0.51ms | 0.58ms | -0.07ms | -12.43% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.90% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -30.88% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -18.43% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -12.45% |
| total | 0.09ms | 0.11ms | -0.02ms | -19.07% |

