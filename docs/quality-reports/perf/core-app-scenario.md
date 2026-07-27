# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.23ms | 50ms | PASS | stable |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 50ms | PASS | stable |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.80ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -8104 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 28512 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.23ms |
| p99 | 0.31ms |
| mean | 0.16ms |
| stdev | 0.04ms |
| min | 0.12ms |
| max | 0.34ms |
| total | 4.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.17ms | -0.02ms | -12.46% |
| p95 | 0.23ms | 0.25ms | -0.02ms | -9.31% |
| p99 | 0.31ms | 0.36ms | -0.05ms | -13.98% |
| mean | 0.16ms | 0.18ms | -0.02ms | -11.62% |
| min | 0.12ms | 0.14ms | -0.02ms | -13.21% |
| max | 0.34ms | 0.40ms | -0.06ms | -15.60% |
| total | 4.86ms | 5.50ms | -0.64ms | -11.62% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.21ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.00ms |
| max | 0.28ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +90.36% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +212.53% |
| p99 | 0.21ms | 0.01ms | +0.20ms | +1744.59% |
| mean | 0.02ms | 0.01ms | +0.01ms | +252.68% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.11% |
| max | 0.28ms | 0.01ms | +0.27ms | +2288.45% |
| total | 0.56ms | 0.16ms | +0.40ms | +252.68% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.13ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +35.34% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +109.33% |
| p99 | 0.13ms | 0.01ms | +0.12ms | +920.62% |
| mean | 0.01ms | 0.01ms | +0.01ms | +138.10% |
| min | 0.01ms | 0.00ms | +0.00ms | +31.73% |
| max | 0.17ms | 0.01ms | +0.16ms | +1165.74% |
| total | 0.39ms | 0.16ms | +0.22ms | +138.10% |

