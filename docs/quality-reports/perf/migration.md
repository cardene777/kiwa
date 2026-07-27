# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| runUp | 0.01ms | 5ms | PASS | stable |
| diffSchema | 0.00ms | 5ms | PASS | stable |
| clientCreate | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | 48 B | 0 B | 102400 B | yes | PASS |
| diffSchema | 21248 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 2856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +153.69% |
| p95 | 0.01ms | 0.00ms | +0.01ms | +523.32% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +152.69% |
| mean | 0.00ms | 0.00ms | +0.00ms | +198.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +75.00% |
| max | 0.07ms | 0.01ms | +0.06ms | +450.44% |
| total | 0.48ms | 0.16ms | +0.32ms | +198.53% |

### diffSchema

# Perf Report — diffSchema.serial

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
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +40.15% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.81% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -30.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +29.35% |
| min | 0.00ms | 0.00ms | +0.00ms | +47.81% |
| max | 0.01ms | 0.01ms | -0.00ms | -32.29% |
| total | 0.31ms | 0.24ms | +0.07ms | +29.35% |

### clientCreate

# Perf Report — clientCreate.serial

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.45% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +43.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.75% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.76% |
| total | 0.06ms | 0.05ms | +0.00ms | +8.75% |

