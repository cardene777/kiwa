# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| driveRoute | 0.03ms | 80ms | PASS | n/a (baseline seeded) |
| driveKv | 0.03ms | 80ms | PASS | n/a (baseline seeded) |
| driveD1 | 0.02ms | 80ms | PASS | n/a (baseline seeded) |
| driveR2 | 0.02ms | 100ms | PASS | n/a (baseline seeded) |
| driveExecutionCtx | 0.01ms | 50ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.23ms | 160ms | PASS |
| driveKv | 0.21ms | 160ms | PASS |
| driveD1 | 0.18ms | 160ms | PASS |
| driveR2 | 0.15ms | 200ms | PASS |
| driveExecutionCtx | 0.09ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| driveRoute | -1538800 B | 0 B | 102400 B | PASS |
| driveKv | 9497264 B | 0 B | 102400 B | PASS |
| driveD1 | -10641048 B | 0 B | 102400 B | PASS |
| driveR2 | -11484552 B | 0 B | 102400 B | PASS |
| driveExecutionCtx | 3965304 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.41ms |
| total | 4.84ms |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.84ms |
| total | 4.67ms |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.09ms |
| min | 0.01ms |
| max | 1.34ms |
| total | 4.03ms |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 2.64ms |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.75ms |

