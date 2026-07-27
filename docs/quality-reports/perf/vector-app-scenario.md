# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.05ms | 200ms | PASS | stable |
| batch_upsert_1000 (chunked upsertVectors) | 0.27ms | 200ms | PASS | stable |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.22ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 0.88ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.16ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 3992 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 278000 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 2296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -9.21% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -14.27% |
| p99 | 0.05ms | 0.06ms | -0.00ms | -6.64% |
| mean | 0.04ms | 0.05ms | -0.00ms | -7.06% |
| min | 0.03ms | 0.03ms | +0.00ms | +1.21% |
| max | 0.06ms | 0.06ms | -0.00ms | -4.75% |
| total | 0.84ms | 0.90ms | -0.06ms | -7.06% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.24ms |
| p95 | 0.27ms |
| p99 | 0.37ms |
| mean | 0.24ms |
| stdev | 0.04ms |
| min | 0.19ms |
| max | 0.39ms |
| total | 4.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.24ms | 0.26ms | -0.02ms | -6.46% |
| p95 | 0.27ms | 0.28ms | -0.01ms | -3.81% |
| p99 | 0.37ms | 0.35ms | +0.02ms | +5.31% |
| mean | 0.24ms | 0.26ms | -0.02ms | -9.38% |
| min | 0.19ms | 0.24ms | -0.05ms | -20.68% |
| max | 0.39ms | 0.37ms | +0.03ms | +7.09% |
| total | 4.78ms | 5.27ms | -0.49ms | -9.38% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.00ms | -7.60% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -9.12% |
| p99 | 0.04ms | 0.08ms | -0.04ms | -47.89% |
| mean | 0.04ms | 0.04ms | -0.00ms | -10.83% |
| min | 0.03ms | 0.03ms | -0.00ms | -0.86% |
| max | 0.04ms | 0.08ms | -0.04ms | -52.90% |
| total | 0.70ms | 0.79ms | -0.09ms | -10.83% |

