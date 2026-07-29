# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.04ms | 0.05ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.20ms | 0.28ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.04ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.15ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 0.96ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.20ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 6440 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 267296 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 288 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0061ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00017ms | +0.45% |
| p50 | 0.04ms | 0.04ms | +0.0011ms | +2.55% |
| p95 | 0.05ms | 0.06ms | -0.0013ms | -2.26% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -30.37% |
| mean | 0.04ms | 0.05ms | -0.0015ms | -3.33% |
| min | 0.03ms | 0.03ms | -0.0013ms | -3.92% |
| max | 0.06ms | 0.09ms | -0.03ms | -34.93% |
| total | 0.89ms | 0.92ms | -0.03ms | -3.33% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.25ms |
| p95 | 0.28ms |
| p99 | 0.37ms |
| mean | 0.24ms |
| stdev | 0.04ms |
| min | 0.20ms |
| max | 0.40ms |
| total | 4.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.24ms | -0.04ms | -17.51% |
| p50 | 0.25ms | 0.29ms | -0.04ms | -14.29% |
| p95 | 0.28ms | 0.32ms | -0.04ms | -13.02% |
| p99 | 0.37ms | 0.38ms | -0.0070ms | -1.83% |
| mean | 0.24ms | 0.28ms | -0.04ms | -14.03% |
| min | 0.20ms | 0.23ms | -0.03ms | -13.96% |
| max | 0.40ms | 0.40ms | +0.0017ms | +0.42% |
| total | 4.89ms | 5.69ms | -0.80ms | -14.03% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0028ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0037ms | -10.06% |
| p50 | 0.04ms | 0.04ms | -0.0063ms | -15.28% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -20.13% |
| p99 | 0.04ms | 0.06ms | -0.01ms | -25.89% |
| mean | 0.04ms | 0.04ms | -0.0071ms | -16.54% |
| min | 0.03ms | 0.04ms | -0.0055ms | -15.30% |
| max | 0.04ms | 0.06ms | -0.02ms | -27.14% |
| total | 0.72ms | 0.86ms | -0.14ms | -16.54% |

