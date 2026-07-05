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
| anvilKeyLookup | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| eventEmitterEmit | 388400 B | 0 B | 102400 B | PASS |
| anvilKeyLookup | 130024 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +12.55% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.64% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +1.28% |
| total | 0.07ms | 0.06ms | +0.00ms | +5.64% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.62% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -6.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.77% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.00ms | 0.00ms | -0.00ms | -17.04% |
| total | 0.04ms | 0.04ms | +0.00ms | +3.77% |

