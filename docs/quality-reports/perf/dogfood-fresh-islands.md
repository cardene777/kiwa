# Perf Suite — dogfood-fresh-islands

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| driveRoute | 0.09ms | 80ms | PASS | stable |
| driveIsland | 0.02ms | 80ms | PASS | stable |
| driveHead | 0.01ms | 50ms | PASS | stable |
| driveEdgeEnv | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 2.38ms | 160ms | PASS |
| driveIsland | 0.10ms | 160ms | PASS |
| driveHead | 0.04ms | 100ms | PASS |
| driveEdgeEnv | 0.09ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| driveRoute | 2582448 B | 18341 B | 102400 B | PASS |
| driveIsland | 4369072 B | 0 B | 102400 B | PASS |
| driveHead | 1788944 B | 0 B | 102400 B | PASS |
| driveEdgeEnv | 3356880 B | 2400 B | 102400 B | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.23ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.41ms |
| total | 10.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +6.89% |
| p95 | 0.09ms | 0.06ms | +0.03ms | +49.39% |
| p99 | 0.23ms | 0.14ms | +0.09ms | +61.25% |
| mean | 0.05ms | 0.04ms | +0.01ms | +14.70% |
| min | 0.03ms | 0.03ms | +0.00ms | +6.96% |
| max | 0.41ms | 0.19ms | +0.22ms | +115.80% |
| total | 10.14ms | 8.84ms | +1.30ms | +14.70% |

### driveIsland

# Perf Report — driveIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 1.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -9.58% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -13.05% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.09% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.79% |
| max | 0.15ms | 0.09ms | +0.06ms | +61.87% |
| total | 1.55ms | 1.57ms | -0.02ms | -1.09% |

### driveHead

# Perf Report — driveHead.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.55% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +8.18% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.40% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.35% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.63% |
| max | 0.02ms | 0.02ms | -0.01ms | -24.06% |
| total | 0.63ms | 0.63ms | +0.00ms | +0.35% |

### driveEdgeEnv

# Perf Report — driveEdgeEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.97% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +24.30% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +10.28% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.28% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.42% |
| max | 0.10ms | 0.02ms | +0.08ms | +326.99% |
| total | 1.57ms | 1.49ms | +0.08ms | +5.28% |

