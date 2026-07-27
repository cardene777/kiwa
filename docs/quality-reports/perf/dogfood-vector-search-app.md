# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| driveIndexBuild | 0.01ms | 80ms | PASS | stable |
| driveSemanticSearch | 0.01ms | 100ms | PASS | stable |
| driveHybridSearch | 0.01ms | 100ms | PASS | stable |
| driveCacheHitRate | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.03ms | 160ms | PASS |
| driveSemanticSearch | 0.03ms | 200ms | PASS |
| driveHybridSearch | 0.04ms | 200ms | PASS |
| driveCacheHitRate | 0.05ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| driveIndexBuild | 1453656 B | 0 B | 102400 B | PASS |
| driveSemanticSearch | 1898368 B | 0 B | 102400 B | PASS |
| driveHybridSearch | 2513240 B | 0 B | 102400 B | PASS |
| driveCacheHitRate | -6603552 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.72% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.01% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +7.91% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.51% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.07% |
| max | 0.03ms | 0.02ms | +0.00ms | +16.80% |
| total | 0.47ms | 0.46ms | +0.02ms | +3.51% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.10ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.88% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -39.54% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +62.86% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.80% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.05% |
| max | 0.10ms | 0.17ms | -0.07ms | -40.08% |
| total | 0.65ms | 0.77ms | -0.11ms | -14.80% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

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
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.89% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.26% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -8.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.83% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.05% |
| max | 0.02ms | 0.02ms | +0.00ms | +11.13% |
| total | 0.59ms | 0.59ms | +0.00ms | +0.83% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +50.87% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +38.34% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +60.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +37.36% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.66% |
| max | 0.04ms | 0.02ms | +0.02ms | +82.88% |
| total | 0.80ms | 0.58ms | +0.22ms | +37.36% |

