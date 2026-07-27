# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.07ms | 200ms | PASS | stable |
| batch_upsert_1000 (chunked upsertVectors) | 0.30ms | 200ms | PASS | stable |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.16ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.13ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.19ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 3952 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 278320 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +12.53% |
| p95 | 0.07ms | 0.06ms | +0.01ms | +12.24% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +16.23% |
| mean | 0.05ms | 0.05ms | +0.01ms | +12.78% |
| min | 0.04ms | 0.03ms | +0.00ms | +10.34% |
| max | 0.07ms | 0.06ms | +0.01ms | +17.22% |
| total | 1.02ms | 0.90ms | +0.12ms | +12.78% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.26ms |
| p95 | 0.30ms |
| p99 | 0.40ms |
| mean | 0.26ms |
| stdev | 0.05ms |
| min | 0.21ms |
| max | 0.43ms |
| total | 5.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.26ms | 0.26ms | +0.00ms | +1.45% |
| p95 | 0.30ms | 0.28ms | +0.01ms | +4.84% |
| p99 | 0.40ms | 0.35ms | +0.06ms | +15.93% |
| mean | 0.26ms | 0.26ms | -0.00ms | -1.55% |
| min | 0.21ms | 0.24ms | -0.03ms | -13.22% |
| max | 0.43ms | 0.37ms | +0.07ms | +18.09% |
| total | 5.19ms | 5.27ms | -0.08ms | -1.55% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +2.85% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +0.03% |
| p99 | 0.05ms | 0.08ms | -0.03ms | -40.60% |
| mean | 0.04ms | 0.04ms | -0.00ms | -0.12% |
| min | 0.04ms | 0.03ms | +0.00ms | +11.70% |
| max | 0.05ms | 0.08ms | -0.04ms | -45.86% |
| total | 0.79ms | 0.79ms | -0.00ms | -0.12% |

