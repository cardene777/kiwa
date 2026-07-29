# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.13ms | 200ms | PASS | stable (差 0.08ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 7.75ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.05ms | 200ms | PASS | stable (検知には +0.5ms (baseline 比 +1245%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.20ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 4.54ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.17ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | -9656 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 688 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | -7736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.13ms |
| p99 | 1.09ms |
| mean | 0.11ms |
| stdev | 0.29ms |
| min | 0.04ms |
| max | 1.33ms |
| total | 2.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +19.73% |
| p95 | 0.13ms | 0.05ms | +0.08ms | +143.31% |
| p99 | 1.09ms | 0.06ms | +1.03ms | +1873.49% |
| mean | 0.11ms | 0.04ms | +0.07ms | +157.74% |
| min | 0.04ms | 0.03ms | +0.01ms | +17.03% |
| max | 1.33ms | 0.06ms | +1.27ms | +2300.45% |
| total | 2.28ms | 0.88ms | +1.39ms | +157.74% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.27ms |
| p95 | 7.75ms |
| p99 | 18.98ms |
| mean | 1.86ms |
| stdev | 4.97ms |
| min | 0.21ms |
| max | 21.79ms |
| total | 37.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.23ms | +0.04ms | +16.79% |
| p95 | 7.75ms | 0.27ms | +7.48ms | +2752.48% |
| p99 | 18.98ms | 0.34ms | +18.64ms | +5446.94% |
| mean | 1.86ms | 0.24ms | +1.62ms | +669.90% |
| min | 0.21ms | 0.22ms | -0.01ms | -4.39% |
| max | 21.79ms | 0.36ms | +21.43ms | +5955.79% |
| total | 37.13ms | 4.82ms | +32.31ms | +669.90% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +13.51% |
| p95 | 0.05ms | 0.04ms | +0.00ms | +12.28% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +18.90% |
| mean | 0.04ms | 0.04ms | +0.00ms | +10.16% |
| min | 0.03ms | 0.03ms | +0.00ms | +7.87% |
| max | 0.05ms | 0.04ms | +0.01ms | +20.53% |
| total | 0.79ms | 0.72ms | +0.07ms | +10.16% |

