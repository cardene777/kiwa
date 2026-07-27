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
| createMacAppEnv | 0.02ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.02ms | 10ms | PASS |
| mockScreencap | 0.07ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createMacAppEnv | -2784 B | 0 B | 102400 B | yes | PASS |
| simulateUserInteraction | 47112 B | 0 B | 102400 B | yes | PASS |
| captureAccessibilityTree | -15512 B | 0 B | 102400 B | yes | PASS |
| mockScreencap | 832 B | 30400 B | 102400 B | yes | PASS |
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
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +76.65% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +260.40% |
| mean | 0.00ms | 0.00ms | +0.00ms | +108.72% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.10% |
| max | 0.07ms | 0.01ms | +0.06ms | +459.38% |
| total | 0.33ms | 0.16ms | +0.17ms | +108.72% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.16% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +6.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +19.90% |
| max | 0.01ms | 0.00ms | +0.00ms | +43.15% |
| total | 0.12ms | 0.11ms | +0.01ms | +12.40% |

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
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.34% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +21.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.54% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -19.05% |
| total | 0.18ms | 0.19ms | -0.01ms | -5.54% |

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
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.72% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -4.97% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.15% |
| min | 0.00ms | 0.00ms | +0.00ms | +147.91% |
| max | 0.02ms | 0.01ms | +0.00ms | +9.94% |
| total | 0.59ms | 0.58ms | +0.01ms | +2.15% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -25.04% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.03% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.16% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +9.84% |
| total | 0.11ms | 0.11ms | -0.00ms | -2.16% |

