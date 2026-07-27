# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.04ms | 100ms | PASS | stable |
| mutation_batch (5 createUser mutations) | 0.02ms | 100ms | PASS | stable |
| subscription_error_handling (5 subscribe + close + invalid) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.12ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.05ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 1624792 B | 0 B | 102400 B | PASS |
| mutation_batch (5 createUser mutations) | 875512 B | 0 B | 102400 B | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 905648 B | 0 B | 102400 B | PASS |

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
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +1.86% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +0.41% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -1.74% |
| mean | 0.03ms | 0.03ms | +0.00ms | +1.32% |
| min | 0.03ms | 0.03ms | -0.00ms | -0.00% |
| max | 0.04ms | 0.04ms | -0.00ms | -2.25% |
| total | 0.61ms | 0.61ms | +0.01ms | +1.32% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -18.17% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -15.28% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -9.84% |
| mean | 0.01ms | 0.02ms | -0.00ms | -17.72% |
| min | 0.01ms | 0.01ms | -0.00ms | -18.41% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.50% |
| total | 0.25ms | 0.30ms | -0.05ms | -17.72% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.16ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.19ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -6.97% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +72.42% |
| p99 | 0.16ms | 0.03ms | +0.14ms | +542.11% |
| mean | 0.03ms | 0.02ms | +0.01ms | +33.83% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.00% |
| max | 0.19ms | 0.03ms | +0.17ms | +658.98% |
| total | 0.62ms | 0.46ms | +0.16ms | +33.83% |

