# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.22ms | 50ms | PASS | stable |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.01ms | 50ms | PASS | stable |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.60ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.16ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -8632 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 10616 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 2216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.13ms |
| p95 | 0.22ms |
| p99 | 0.25ms |
| mean | 0.14ms |
| stdev | 0.04ms |
| min | 0.11ms |
| max | 0.26ms |
| total | 4.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.17ms | -0.04ms | -22.27% |
| p95 | 0.22ms | 0.25ms | -0.03ms | -13.40% |
| p99 | 0.25ms | 0.36ms | -0.11ms | -31.26% |
| mean | 0.14ms | 0.18ms | -0.04ms | -22.46% |
| min | 0.11ms | 0.14ms | -0.03ms | -21.45% |
| max | 0.26ms | 0.40ms | -0.14ms | -35.86% |
| total | 4.26ms | 5.50ms | -1.23ms | -22.46% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.10ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -22.81% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +43.58% |
| p99 | 0.08ms | 0.01ms | +0.06ms | +561.12% |
| mean | 0.01ms | 0.01ms | +0.00ms | +50.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.62% |
| max | 0.10ms | 0.01ms | +0.09ms | +746.15% |
| total | 0.24ms | 0.16ms | +0.08ms | +50.57% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +24.65% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +45.56% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +62.05% |
| mean | 0.01ms | 0.01ms | +0.00ms | +35.41% |
| min | 0.01ms | 0.00ms | +0.00ms | +18.28% |
| max | 0.02ms | 0.01ms | +0.01ms | +65.43% |
| total | 0.22ms | 0.16ms | +0.06ms | +35.41% |

