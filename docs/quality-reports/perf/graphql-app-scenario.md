# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.04ms | 100ms | PASS | stable |
| mutation_batch (5 createUser mutations) | 0.02ms | 100ms | PASS | stable |
| subscription_error_handling (5 subscribe + close + invalid) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.14ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.06ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 48648 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 45896 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 1160 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -15.62% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -16.12% |
| p99 | 0.05ms | 0.05ms | -0.01ms | -16.33% |
| mean | 0.03ms | 0.04ms | -0.01ms | -15.81% |
| min | 0.03ms | 0.03ms | -0.01ms | -15.40% |
| max | 0.05ms | 0.06ms | -0.01ms | -16.38% |
| total | 0.66ms | 0.78ms | -0.12ms | -15.81% |

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
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +12.08% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +21.46% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +21.63% |
| mean | 0.02ms | 0.01ms | +0.00ms | +13.36% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.93% |
| max | 0.02ms | 0.02ms | +0.00ms | +21.67% |
| total | 0.33ms | 0.29ms | +0.04ms | +13.36% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +2.60% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -12.26% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +0.81% |
| mean | 0.03ms | 0.02ms | +0.00ms | +2.17% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.69% |
| max | 0.04ms | 0.03ms | +0.00ms | +3.78% |
| total | 0.51ms | 0.49ms | +0.01ms | +2.17% |

