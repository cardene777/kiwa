# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upsertOne | 0.00ms | 5ms | PASS | stable |
| queryNearestTop5 | 0.08ms | 5ms | PASS | stable |
| fetchById | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.03ms | 10ms | PASS |
| queryNearestTop5 | 0.75ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | 163664 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -14752 B | 0 B | 102400 B | yes | PASS |
| fetchById | -128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.54% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.49% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.77% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.49% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.03% |
| total | 0.29ms | 0.25ms | +0.04ms | +15.77% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.18ms |
| total | 12.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +0.32% |
| p95 | 0.08ms | 0.09ms | -0.01ms | -9.28% |
| p99 | 0.10ms | 0.15ms | -0.05ms | -34.42% |
| mean | 0.06ms | 0.07ms | -0.00ms | -2.33% |
| min | 0.06ms | 0.05ms | +0.00ms | +5.22% |
| max | 0.18ms | 0.22ms | -0.05ms | -20.71% |
| total | 12.87ms | 13.18ms | -0.31ms | -2.33% |

### fetchById

# Perf Report — fetchById.serial

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.81% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.81% |
| mean | 0.00ms | 0.00ms | -0.00ms | -21.75% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| max | 0.01ms | 0.02ms | -0.01ms | -57.35% |
| total | 0.07ms | 0.09ms | -0.02ms | -21.75% |

