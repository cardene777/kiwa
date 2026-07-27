# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.23ms | 50ms | PASS | stable |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.01ms | 50ms | PASS | stable |
| spec_pool_integration (parseSpec + pool per case) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.79ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.04ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 2647984 B | 0 B | 102400 B | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 98448 B | 0 B | 102400 B | PASS |
| spec_pool_integration (parseSpec + pool per case) | 507200 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.15ms |
| p95 | 0.23ms |
| p99 | 0.29ms |
| mean | 0.16ms |
| stdev | 0.04ms |
| min | 0.12ms |
| max | 0.31ms |
| total | 4.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.15ms | -0.01ms | -4.68% |
| p95 | 0.23ms | 0.28ms | -0.05ms | -18.11% |
| p99 | 0.29ms | 0.32ms | -0.03ms | -10.17% |
| mean | 0.16ms | 0.17ms | -0.01ms | -4.39% |
| min | 0.12ms | 0.13ms | -0.01ms | -4.16% |
| max | 0.31ms | 0.33ms | -0.01ms | -4.17% |
| total | 4.85ms | 5.07ms | -0.22ms | -4.39% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +6.41% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +21.30% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +19.85% |
| mean | 0.01ms | 0.01ms | +0.00ms | +15.86% |
| min | 0.00ms | 0.00ms | +0.00ms | +24.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.57% |
| total | 0.18ms | 0.16ms | +0.02ms | +15.86% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.33% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +1.32% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.82% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.42% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.44% |
| max | 0.02ms | 0.01ms | +0.00ms | +9.91% |
| total | 0.18ms | 0.19ms | -0.01ms | -6.42% |

