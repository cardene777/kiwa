# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.03ms | 0.05ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.20ms | 0.27ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.04ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.15ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 0.96ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.16ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 6016 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 266320 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 368 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0067ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0030ms | -8.04% |
| p50 | 0.04ms | 0.04ms | -0.0027ms | -6.30% |
| p95 | 0.05ms | 0.06ms | -0.0025ms | -4.40% |
| p99 | 0.05ms | 0.08ms | -0.03ms | -33.21% |
| mean | 0.04ms | 0.05ms | -0.0033ms | -7.20% |
| min | 0.03ms | 0.03ms | -0.0012ms | -3.43% |
| max | 0.05ms | 0.09ms | -0.03ms | -37.89% |
| total | 0.85ms | 0.92ms | -0.07ms | -7.20% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.24ms |
| p95 | 0.27ms |
| p99 | 0.39ms |
| mean | 0.24ms |
| stdev | 0.05ms |
| min | 0.19ms |
| max | 0.42ms |
| total | 4.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.24ms | -0.04ms | -18.10% |
| p50 | 0.24ms | 0.29ms | -0.04ms | -15.62% |
| p95 | 0.27ms | 0.32ms | -0.04ms | -13.99% |
| p99 | 0.39ms | 0.38ms | +0.01ms | +3.12% |
| mean | 0.24ms | 0.28ms | -0.04ms | -14.58% |
| min | 0.19ms | 0.23ms | -0.04ms | -16.14% |
| max | 0.42ms | 0.40ms | +0.03ms | +6.56% |
| total | 4.86ms | 5.69ms | -0.83ms | -14.58% |

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
| stdev | 0.0022ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0027ms | -7.38% |
| p50 | 0.04ms | 0.04ms | -0.0049ms | -11.81% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -21.94% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -27.50% |
| mean | 0.04ms | 0.04ms | -0.0066ms | -15.47% |
| min | 0.03ms | 0.04ms | -0.0030ms | -8.46% |
| max | 0.04ms | 0.06ms | -0.02ms | -28.71% |
| total | 0.73ms | 0.86ms | -0.13ms | -15.47% |

