# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.06ms | 200ms | PASS | stable |
| batch_upsert_1000 (chunked upsertVectors) | 0.33ms | 200ms | PASS | stable |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.21ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.03ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.17ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | -5488 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | -283784 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 1896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.00ms | +10.38% |
| p95 | 0.06ms | 0.06ms | +0.00ms | +3.51% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +14.34% |
| mean | 0.05ms | 0.05ms | +0.01ms | +11.96% |
| min | 0.04ms | 0.03ms | +0.01ms | +27.62% |
| max | 0.07ms | 0.06ms | +0.01ms | +17.01% |
| total | 1.01ms | 0.90ms | +0.11ms | +11.96% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.27ms |
| p95 | 0.33ms |
| p99 | 0.41ms |
| mean | 0.27ms |
| stdev | 0.05ms |
| min | 0.22ms |
| max | 0.42ms |
| total | 5.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.26ms | +0.02ms | +6.85% |
| p95 | 0.33ms | 0.28ms | +0.05ms | +16.92% |
| p99 | 0.41ms | 0.35ms | +0.06ms | +16.22% |
| mean | 0.27ms | 0.26ms | +0.01ms | +2.69% |
| min | 0.22ms | 0.24ms | -0.03ms | -10.55% |
| max | 0.42ms | 0.37ms | +0.06ms | +16.08% |
| total | 5.41ms | 5.27ms | +0.14ms | +2.69% |

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
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +5.14% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +0.93% |
| p99 | 0.05ms | 0.08ms | -0.03ms | -39.01% |
| mean | 0.04ms | 0.04ms | +0.00ms | +1.99% |
| min | 0.04ms | 0.03ms | +0.00ms | +14.04% |
| max | 0.05ms | 0.08ms | -0.04ms | -44.17% |
| total | 0.81ms | 0.79ms | +0.02ms | +1.99% |

