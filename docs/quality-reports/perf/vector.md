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
| queryNearestTop5 | 0.67ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | 161456 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | 656 B | 0 B | 102400 B | yes | PASS |
| fetchById | 2856 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.76% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.43% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +11.68% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.72% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.29% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.77% |
| total | 0.27ms | 0.25ms | +0.03ms | +10.72% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.18ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.23ms |
| total | 12.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | -0.00ms | -0.68% |
| p95 | 0.07ms | 0.09ms | -0.01ms | -15.01% |
| p99 | 0.18ms | 0.15ms | +0.03ms | +18.64% |
| mean | 0.06ms | 0.07ms | -0.00ms | -2.37% |
| min | 0.06ms | 0.05ms | +0.00ms | +6.47% |
| max | 0.23ms | 0.22ms | +0.01ms | +4.44% |
| total | 12.87ms | 13.18ms | -0.31ms | -2.37% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.51% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +39.50% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.88% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -32.00% |
| total | 0.08ms | 0.09ms | -0.00ms | -4.88% |

