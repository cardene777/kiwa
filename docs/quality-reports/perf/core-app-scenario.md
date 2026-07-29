# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.23ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +147%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +5706%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| spec_pool_integration (parseSpec + pool per case) | 0.02ms | 50ms | PASS | stable (差 0.06ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.62ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.03ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 0.22ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -6480 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 26416 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 1912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.14ms |
| p95 | 0.23ms |
| p99 | 0.35ms |
| mean | 0.16ms |
| stdev | 0.05ms |
| min | 0.12ms |
| max | 0.40ms |
| total | 4.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.14ms | 0.15ms | -0.00ms | -2.61% |
| p95 | 0.23ms | 0.34ms | -0.11ms | -33.05% |
| p99 | 0.35ms | 0.60ms | -0.25ms | -41.02% |
| mean | 0.16ms | 0.19ms | -0.03ms | -17.79% |
| min | 0.12ms | 0.12ms | +0.00ms | +0.18% |
| max | 0.40ms | 0.70ms | -0.30ms | -43.27% |
| total | 4.77ms | 5.81ms | -1.03ms | -17.79% |

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
| max | 0.11ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -20.89% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +20.66% |
| p99 | 0.08ms | 0.01ms | +0.07ms | +722.60% |
| mean | 0.01ms | 0.01ms | +0.00ms | +45.10% |
| min | 0.00ms | 0.01ms | -0.00ms | -23.15% |
| max | 0.11ms | 0.01ms | +0.10ms | +1005.70% |
| total | 0.25ms | 0.17ms | +0.08ms | +45.10% |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.01ms | -51.61% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -80.84% |
| p99 | 0.02ms | 0.09ms | -0.07ms | -77.39% |
| mean | 0.01ms | 0.02ms | -0.01ms | -63.44% |
| min | 0.01ms | 0.00ms | +0.00ms | +23.23% |
| max | 0.02ms | 0.09ms | -0.07ms | -75.42% |
| total | 0.24ms | 0.65ms | -0.41ms | -63.44% |

