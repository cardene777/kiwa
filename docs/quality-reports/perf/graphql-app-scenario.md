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
| query_workflow (10 client.query with variables) | 0.13ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.12ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 71344 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 44184 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -16.90% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -19.24% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -23.00% |
| mean | 0.03ms | 0.04ms | -0.01ms | -20.13% |
| min | 0.03ms | 0.03ms | -0.01ms | -24.02% |
| max | 0.04ms | 0.06ms | -0.01ms | -23.86% |
| total | 0.63ms | 0.78ms | -0.16ms | -20.13% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.68% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +23.42% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +39.50% |
| mean | 0.02ms | 0.01ms | +0.00ms | +6.45% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.09% |
| max | 0.03ms | 0.02ms | +0.01ms | +43.10% |
| total | 0.31ms | 0.29ms | +0.02ms | +6.45% |

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
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -15.01% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -5.20% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -8.32% |
| mean | 0.02ms | 0.02ms | -0.00ms | -10.76% |
| min | 0.02ms | 0.02ms | -0.00ms | -10.37% |
| max | 0.03ms | 0.03ms | -0.00ms | -9.03% |
| total | 0.44ms | 0.49ms | -0.05ms | -10.76% |

