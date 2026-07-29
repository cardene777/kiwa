# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.03ms | 0.05ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.20ms | 0.27ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.06ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.15ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 0.97ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.17ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 6896 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 267392 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0065ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0042ms | -11.31% |
| p50 | 0.04ms | 0.04ms | -0.0039ms | -8.90% |
| p95 | 0.05ms | 0.06ms | -0.0054ms | -9.70% |
| p99 | 0.05ms | 0.08ms | -0.03ms | -31.36% |
| mean | 0.04ms | 0.05ms | -0.0053ms | -11.58% |
| min | 0.03ms | 0.03ms | -0.0020ms | -6.01% |
| max | 0.06ms | 0.09ms | -0.03ms | -34.88% |
| total | 0.81ms | 0.92ms | -0.11ms | -11.58% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.24ms |
| p95 | 0.27ms |
| p99 | 0.38ms |
| mean | 0.24ms |
| stdev | 0.05ms |
| min | 0.19ms |
| max | 0.41ms |
| total | 4.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.24ms | -0.05ms | -19.32% |
| p50 | 0.24ms | 0.29ms | -0.05ms | -17.68% |
| p95 | 0.27ms | 0.32ms | -0.05ms | -16.26% |
| p99 | 0.38ms | 0.38ms | +0.0013ms | +0.33% |
| mean | 0.24ms | 0.28ms | -0.05ms | -16.43% |
| min | 0.19ms | 0.23ms | -0.04ms | -16.17% |
| max | 0.41ms | 0.40ms | +0.01ms | +3.66% |
| total | 4.75ms | 5.69ms | -0.93ms | -16.43% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.0083ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0024ms | -6.37% |
| p50 | 0.04ms | 0.04ms | -0.0050ms | -12.16% |
| p95 | 0.06ms | 0.05ms | +0.0077ms | +15.19% |
| p99 | 0.07ms | 0.06ms | +0.0083ms | +14.62% |
| mean | 0.04ms | 0.04ms | -0.0038ms | -8.90% |
| min | 0.03ms | 0.04ms | -0.0017ms | -4.75% |
| max | 0.07ms | 0.06ms | +0.0085ms | +14.50% |
| total | 0.78ms | 0.86ms | -0.08ms | -8.90% |

