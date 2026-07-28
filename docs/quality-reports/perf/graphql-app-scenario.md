# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1083%) 以上の悪化が必要) |
| mutation_batch (5 createUser mutations) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3042%) 以上の悪化が必要) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1793%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.13ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.06ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 55616 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 36928 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -2080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -7.55% |
| p95 | 0.04ms | 0.05ms | -0.00ms | -6.37% |
| p99 | 0.05ms | 0.05ms | -0.00ms | -2.99% |
| mean | 0.03ms | 0.03ms | -0.00ms | -6.96% |
| min | 0.03ms | 0.03ms | -0.00ms | -10.65% |
| max | 0.05ms | 0.05ms | -0.00ms | -2.18% |
| total | 0.63ms | 0.68ms | -0.05ms | -6.96% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.17% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +11.02% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +54.29% |
| mean | 0.02ms | 0.01ms | +0.00ms | +14.59% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.13% |
| max | 0.03ms | 0.02ms | +0.01ms | +64.85% |
| total | 0.30ms | 0.26ms | +0.04ms | +14.59% |

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
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -2.91% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -9.33% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +7.41% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.72% |
| min | 0.02ms | 0.02ms | -0.00ms | -4.86% |
| max | 0.03ms | 0.03ms | +0.00ms | +11.33% |
| total | 0.45ms | 0.46ms | -0.01ms | -2.72% |

