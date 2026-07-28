# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.86ms | 200ms | PASS | regressed |
| batch_upsert_1000 (chunked upsertVectors) | 0.27ms | 200ms | PASS | stable (検知には +0.5ms (baseline 比 +184%) 以上の悪化が必要) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.04ms | 200ms | PASS | stable (検知には +0.5ms (baseline 比 +1245%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.27ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.69ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.16ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 2808 B | -583 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 277488 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 1088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.27ms |
| p95 | 0.86ms |
| p99 | 0.87ms |
| mean | 0.33ms |
| stdev | 0.29ms |
| min | 0.04ms |
| max | 0.87ms |
| total | 6.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.04ms | +0.23ms | +536.35% |
| p95 | 0.86ms | 0.05ms | +0.80ms | +1474.31% |
| p99 | 0.87ms | 0.06ms | +0.81ms | +1475.44% |
| mean | 0.33ms | 0.04ms | +0.29ms | +654.08% |
| min | 0.04ms | 0.03ms | +0.01ms | +24.45% |
| max | 0.87ms | 0.06ms | +0.82ms | +1475.72% |
| total | 6.66ms | 0.88ms | +5.78ms | +654.08% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.23ms |
| p95 | 0.27ms |
| p99 | 0.40ms |
| mean | 0.24ms |
| stdev | 0.05ms |
| min | 0.20ms |
| max | 0.43ms |
| total | 4.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.23ms | 0.23ms | +0.00ms | +0.95% |
| p95 | 0.27ms | 0.27ms | -0.00ms | -1.06% |
| p99 | 0.40ms | 0.34ms | +0.06ms | +16.35% |
| mean | 0.24ms | 0.24ms | -0.00ms | -0.20% |
| min | 0.20ms | 0.22ms | -0.03ms | -12.07% |
| max | 0.43ms | 0.36ms | +0.07ms | +19.64% |
| total | 4.81ms | 4.82ms | -0.01ms | -0.20% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +0.59% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -0.89% |
| p99 | 0.04ms | 0.04ms | -0.00ms | -1.81% |
| mean | 0.04ms | 0.04ms | -0.00ms | -0.17% |
| min | 0.03ms | 0.03ms | +0.00ms | +3.94% |
| max | 0.04ms | 0.04ms | -0.00ms | -2.03% |
| total | 0.72ms | 0.72ms | -0.00ms | -0.17% |

