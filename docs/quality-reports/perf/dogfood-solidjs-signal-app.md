# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| driveCounter | 0.02ms | 50ms | PASS | stable |
| driveTodos | 0.03ms | 80ms | PASS | stable |
| driveResource | 0.04ms | 100ms | PASS | regressed |
| driveSuspense | 1.59ms | 150ms | PASS | regressed |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.16ms | 100ms | PASS |
| driveTodos | 0.31ms | 160ms | PASS |
| driveResource | 0.43ms | 200ms | PASS |
| driveSuspense | 2.69ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| driveCounter | -3045248 B | 0 B | 102400 B | PASS |
| driveTodos | 221640 B | 0 B | 102400 B | PASS |
| driveResource | 2609728 B | 0 B | 102400 B | PASS |
| driveSuspense | -3940480 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 2.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.91% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +16.26% |
| p99 | 0.04ms | 0.03ms | +0.00ms | +9.98% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.24% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.35% |
| max | 0.07ms | 0.03ms | +0.04ms | +102.86% |
| total | 2.69ms | 2.56ms | +0.13ms | +5.24% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 3.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.55% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +1.91% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -18.09% |
| mean | 0.02ms | 0.02ms | +0.00ms | +4.68% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.18% |
| max | 0.17ms | 0.17ms | +0.00ms | +0.15% |
| total | 3.42ms | 3.27ms | +0.15ms | +4.68% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.04ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.06ms |
| min | 0.00ms |
| max | 0.78ms |
| total | 3.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.08% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +356.02% |
| p99 | 0.13ms | 0.02ms | +0.11ms | +639.99% |
| mean | 0.02ms | 0.01ms | +0.01ms | +194.41% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.10% |
| max | 0.78ms | 0.04ms | +0.73ms | +1765.80% |
| total | 3.01ms | 1.02ms | +1.99ms | +194.41% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 1.21ms |
| p95 | 1.59ms |
| p99 | 2.21ms |
| mean | 1.24ms |
| stdev | 0.28ms |
| min | 0.03ms |
| max | 2.80ms |
| total | 247.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.21ms | 1.16ms | +0.05ms | +4.38% |
| p95 | 1.59ms | 1.20ms | +0.40ms | +33.20% |
| p99 | 2.21ms | 1.23ms | +0.99ms | +80.33% |
| mean | 1.24ms | 1.15ms | +0.09ms | +8.09% |
| min | 0.03ms | 0.02ms | +0.01ms | +41.46% |
| max | 2.80ms | 1.23ms | +1.57ms | +127.13% |
| total | 247.59ms | 229.05ms | +18.54ms | +8.09% |

