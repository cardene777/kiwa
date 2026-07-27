# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| eventEmitterEmit | 0.00ms | 5ms | PASS | stable |
| anvilKeyLookup | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.01ms | 10ms | PASS |
| anvilKeyLookup | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| eventEmitterEmit | -44408 B | 0 B | 102400 B | yes | PASS |
| anvilKeyLookup | -560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### eventEmitterEmit

# Perf Report — eventEmitterEmit.serial

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
| max | 0.00ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.46% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -36.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.11% |
| min | 0.00ms | 0.00ms | -0.00ms | -28.52% |
| max | 0.00ms | 0.01ms | -0.00ms | -33.77% |
| total | 0.07ms | 0.08ms | -0.01ms | -11.11% |

### anvilKeyLookup

# Perf Report — anvilKeyLookup.serial

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
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.68% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -5.56% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.00ms | 0.00ms | -0.00ms | -38.09% |
| total | 0.04ms | 0.05ms | -0.01ms | -11.92% |

