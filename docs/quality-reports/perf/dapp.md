# Perf Suite — dapp

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| eventEmitterEmit | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +109170%) 以上の悪化が必要) |
| anvilKeyLookup | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +200000%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| eventEmitterEmit | 0.01ms | 10ms | PASS |
| anvilKeyLookup | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| eventEmitterEmit | 230928 B | 0 B | 102400 B | yes | PASS |
| anvilKeyLookup | -43152 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.21% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.58% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.62% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.01ms | -0.00ms | -44.51% |
| total | 0.07ms | 0.08ms | -0.00ms | -6.62% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +40.26% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +39.23% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.42% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.00ms | 0.00ms | -0.00ms | -48.79% |
| total | 0.04ms | 0.04ms | +0.00ms | +5.42% |

