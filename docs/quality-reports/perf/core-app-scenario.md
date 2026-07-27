# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.31ms | 50ms | PASS | stable |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.01ms | 50ms | PASS | stable |
| spec_pool_integration (parseSpec + pool per case) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.68ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.04ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -5864 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 12760 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 1576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.15ms |
| p95 | 0.31ms |
| p99 | 0.47ms |
| mean | 0.18ms |
| stdev | 0.09ms |
| min | 0.11ms |
| max | 0.53ms |
| total | 5.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.17ms | -0.02ms | -10.06% |
| p95 | 0.31ms | 0.25ms | +0.06ms | +24.76% |
| p99 | 0.47ms | 0.36ms | +0.11ms | +29.68% |
| mean | 0.18ms | 0.18ms | -0.00ms | -1.74% |
| min | 0.11ms | 0.14ms | -0.03ms | -21.79% |
| max | 0.53ms | 0.40ms | +0.13ms | +31.38% |
| total | 5.40ms | 5.50ms | -0.10ms | -1.74% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.10ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +6.06% |
| p99 | 0.07ms | 0.01ms | +0.06ms | +557.68% |
| mean | 0.01ms | 0.01ms | +0.00ms | +49.72% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.19% |
| max | 0.10ms | 0.01ms | +0.09ms | +759.17% |
| total | 0.24ms | 0.16ms | +0.08ms | +49.72% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +26.03% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.25% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +17.60% |
| mean | 0.01ms | 0.01ms | +0.00ms | +22.98% |
| min | 0.01ms | 0.00ms | +0.00ms | +21.16% |
| max | 0.02ms | 0.01ms | +0.00ms | +20.06% |
| total | 0.20ms | 0.16ms | +0.04ms | +22.98% |

