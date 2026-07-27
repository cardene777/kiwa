# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upsertOne | 0.00ms | 5ms | PASS | regressed |
| queryNearestTop5 | 0.08ms | 5ms | PASS | stable |
| fetchById | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.65ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| upsertOne | 589832 B | 0 B | 102400 B | PASS |
| queryNearestTop5 | 3723968 B | 0 B | 102400 B | PASS |
| fetchById | 129568 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

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
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +138.50% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +91.14% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +68.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +129.72% |
| min | 0.00ms | 0.00ms | +0.00ms | +159.28% |
| max | 0.01ms | 0.01ms | +0.00ms | +70.41% |
| total | 0.55ms | 0.24ms | +0.31ms | +129.72% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.13ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.20ms |
| total | 11.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.00ms | -2.99% |
| p95 | 0.08ms | 0.07ms | +0.00ms | +0.43% |
| p99 | 0.13ms | 0.16ms | -0.03ms | -19.76% |
| mean | 0.06ms | 0.06ms | -0.00ms | -1.21% |
| min | 0.05ms | 0.05ms | +0.00ms | +6.75% |
| max | 0.20ms | 0.32ms | -0.12ms | -36.02% |
| total | 11.92ms | 12.07ms | -0.15ms | -1.21% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.02% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +26.79% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.23% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.01ms | -42.85% |
| total | 0.06ms | 0.07ms | -0.00ms | -4.23% |

