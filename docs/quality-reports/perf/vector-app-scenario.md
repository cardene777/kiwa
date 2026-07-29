# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.04ms | 0.05ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.19ms | 0.29ms | 200ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.04ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.16ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 0.97ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.16ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 7456 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 265952 B | 0 B | 102400 B | yes | PASS |
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
| stdev | 0.0063ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0022ms | -5.80% |
| p50 | 0.04ms | 0.04ms | -0.0031ms | -7.27% |
| p95 | 0.05ms | 0.06ms | -0.0014ms | -2.47% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -27.98% |
| mean | 0.04ms | 0.05ms | -0.0034ms | -7.40% |
| min | 0.03ms | 0.03ms | -0.00013ms | -0.37% |
| max | 0.06ms | 0.09ms | -0.03ms | -32.12% |
| total | 0.85ms | 0.92ms | -0.07ms | -7.40% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.24ms |
| p95 | 0.29ms |
| p99 | 0.36ms |
| mean | 0.24ms |
| stdev | 0.04ms |
| min | 0.19ms |
| max | 0.37ms |
| total | 4.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.24ms | -0.05ms | -21.19% |
| p50 | 0.24ms | 0.29ms | -0.05ms | -16.09% |
| p95 | 0.29ms | 0.32ms | -0.03ms | -8.34% |
| p99 | 0.36ms | 0.38ms | -0.02ms | -6.17% |
| mean | 0.24ms | 0.28ms | -0.05ms | -16.65% |
| min | 0.19ms | 0.23ms | -0.04ms | -18.52% |
| max | 0.37ms | 0.40ms | -0.02ms | -5.74% |
| total | 4.74ms | 5.69ms | -0.95ms | -16.65% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0031ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0037ms | -10.09% |
| p50 | 0.03ms | 0.04ms | -0.0069ms | -16.63% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -21.20% |
| p99 | 0.04ms | 0.06ms | -0.01ms | -22.44% |
| mean | 0.04ms | 0.04ms | -0.0076ms | -17.70% |
| min | 0.03ms | 0.04ms | -0.0060ms | -16.81% |
| max | 0.05ms | 0.06ms | -0.01ms | -22.71% |
| total | 0.71ms | 0.86ms | -0.15ms | -17.70% |

