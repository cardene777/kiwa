# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.26ms | 50ms | PASS | stable |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.01ms | 50ms | PASS | stable |
| spec_pool_integration (parseSpec + pool per case) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.65ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 2616144 B | 0 B | 102400 B | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 582904 B | 0 B | 102400 B | PASS |
| spec_pool_integration (parseSpec + pool per case) | 507224 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.13ms |
| p95 | 0.26ms |
| p99 | 0.33ms |
| mean | 0.15ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.34ms |
| total | 4.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.15ms | -0.02ms | -15.17% |
| p95 | 0.26ms | 0.28ms | -0.01ms | -4.58% |
| p99 | 0.33ms | 0.32ms | +0.01ms | +2.31% |
| mean | 0.15ms | 0.17ms | -0.02ms | -10.90% |
| min | 0.11ms | 0.13ms | -0.02ms | -15.33% |
| max | 0.34ms | 0.33ms | +0.01ms | +3.84% |
| total | 4.52ms | 5.07ms | -0.55ms | -10.90% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -23.08% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +8.49% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +60.99% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.65% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.47% |
| max | 0.02ms | 0.01ms | +0.01ms | +82.20% |
| total | 0.15ms | 0.16ms | -0.00ms | -2.65% |

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
| min | 0.00ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.16% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -1.62% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +5.12% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.66% |
| min | 0.00ms | 0.01ms | -0.00ms | -3.24% |
| max | 0.02ms | 0.01ms | +0.00ms | +7.28% |
| total | 0.18ms | 0.19ms | -0.01ms | -7.66% |

