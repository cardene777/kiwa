# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.06ms | 100ms | PASS | stable |
| mutation_batch (5 createUser mutations) | 0.02ms | 100ms | PASS | stable |
| subscription_error_handling (5 subscribe + close + invalid) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.16ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 111432 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 44184 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.11ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.13ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.00ms | -4.30% |
| p95 | 0.06ms | 0.05ms | +0.01ms | +13.30% |
| p99 | 0.11ms | 0.05ms | +0.06ms | +106.49% |
| mean | 0.04ms | 0.04ms | +0.00ms | +6.13% |
| min | 0.03ms | 0.03ms | -0.00ms | -3.33% |
| max | 0.13ms | 0.06ms | +0.07ms | +127.89% |
| total | 0.83ms | 0.78ms | +0.05ms | +6.13% |

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
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +6.04% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +22.52% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +15.21% |
| mean | 0.02ms | 0.01ms | +0.00ms | +5.38% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.48% |
| max | 0.02ms | 0.02ms | +0.00ms | +13.57% |
| total | 0.30ms | 0.29ms | +0.02ms | +5.38% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

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
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +17.86% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +34.96% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +51.53% |
| mean | 0.03ms | 0.02ms | +0.01ms | +21.69% |
| min | 0.03ms | 0.02ms | +0.00ms | +14.53% |
| max | 0.05ms | 0.03ms | +0.02ms | +55.31% |
| total | 0.60ms | 0.49ms | +0.11ms | +21.69% |

