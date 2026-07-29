# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1083%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.02ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1793%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.14ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 82856 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 37448 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 3016 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.01ms | +26.13% |
| p95 | 0.05ms | 0.05ms | +0.01ms | +13.12% |
| p99 | 0.06ms | 0.05ms | +0.01ms | +17.20% |
| mean | 0.04ms | 0.03ms | +0.01ms | +18.11% |
| min | 0.03ms | 0.03ms | +0.00ms | +11.80% |
| max | 0.06ms | 0.05ms | +0.01ms | +18.19% |
| total | 0.80ms | 0.68ms | +0.12ms | +18.11% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +32.51% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +29.13% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +28.40% |
| mean | 0.02ms | 0.01ms | +0.00ms | +32.81% |
| min | 0.02ms | 0.01ms | +0.00ms | +28.37% |
| max | 0.02ms | 0.02ms | +0.00ms | +28.22% |
| total | 0.35ms | 0.26ms | +0.09ms | +32.81% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +8.27% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -5.18% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -6.42% |
| mean | 0.02ms | 0.02ms | +0.00ms | +5.78% |
| min | 0.02ms | 0.02ms | +0.00ms | +7.59% |
| max | 0.03ms | 0.03ms | -0.00ms | -6.71% |
| total | 0.49ms | 0.46ms | +0.03ms | +5.78% |

