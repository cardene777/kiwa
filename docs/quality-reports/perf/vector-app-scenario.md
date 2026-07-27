# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.05ms | 200ms | PASS | stable |
| batch_upsert_1000 (chunked upsertVectors) | 0.24ms | 200ms | PASS | stable |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.15ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.02ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.15ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 1830528 B | 0 B | 102400 B | PASS |
| batch_upsert_1000 (chunked upsertVectors) | -1721008 B | 0 B | 102400 B | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 395256 B | 0 B | 102400 B | PASS |

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
| max | 0.05ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +3.09% |
| p95 | 0.05ms | 0.05ms | -0.00ms | -2.74% |
| p99 | 0.05ms | 0.05ms | +0.00ms | +0.21% |
| mean | 0.04ms | 0.04ms | +0.00ms | +3.51% |
| min | 0.03ms | 0.03ms | +0.00ms | +0.12% |
| max | 0.05ms | 0.05ms | +0.00ms | +0.94% |
| total | 0.86ms | 0.84ms | +0.03ms | +3.51% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.21ms |
| p95 | 0.24ms |
| p99 | 0.38ms |
| mean | 0.22ms |
| stdev | 0.05ms |
| min | 0.20ms |
| max | 0.42ms |
| total | 4.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.21ms | 0.21ms | +0.00ms | +0.53% |
| p95 | 0.24ms | 0.23ms | +0.00ms | +2.13% |
| p99 | 0.38ms | 0.23ms | +0.15ms | +63.73% |
| mean | 0.22ms | 0.21ms | +0.01ms | +3.00% |
| min | 0.20ms | 0.20ms | -0.00ms | -0.53% |
| max | 0.42ms | 0.23ms | +0.18ms | +79.07% |
| total | 4.38ms | 4.26ms | +0.13ms | +3.00% |

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
| p50 | 0.03ms | 0.03ms | +0.00ms | +0.30% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +2.72% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +2.84% |
| mean | 0.04ms | 0.03ms | +0.00ms | +1.46% |
| min | 0.03ms | 0.03ms | +0.00ms | +8.26% |
| max | 0.04ms | 0.04ms | +0.00ms | +2.87% |
| total | 0.70ms | 0.69ms | +0.01ms | +1.46% |

