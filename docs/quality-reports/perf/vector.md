# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upsertOne | 0.00ms | 5ms | PASS | stable |
| queryNearestTop5 | 0.07ms | 5ms | PASS | stable |
| fetchById | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.76ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | 163664 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -14984 B | 0 B | 102400 B | yes | PASS |
| fetchById | 1928 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.36% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.04% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.50% |
| total | 0.25ms | 0.25ms | +0.00ms | +1.04% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.11ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.17ms |
| total | 12.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +3.75% |
| p95 | 0.07ms | 0.09ms | -0.02ms | -18.45% |
| p99 | 0.11ms | 0.15ms | -0.04ms | -23.50% |
| mean | 0.06ms | 0.07ms | -0.00ms | -3.13% |
| min | 0.06ms | 0.05ms | +0.00ms | +6.78% |
| max | 0.17ms | 0.22ms | -0.06ms | -25.48% |
| total | 12.76ms | 13.18ms | -0.41ms | -3.13% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.38% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.02% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.16% |
| mean | 0.00ms | 0.00ms | -0.00ms | -26.67% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.01ms | 0.02ms | -0.01ms | -66.00% |
| total | 0.06ms | 0.09ms | -0.02ms | -26.67% |

