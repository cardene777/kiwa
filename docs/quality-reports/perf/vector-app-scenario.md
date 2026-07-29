# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.04ms | 0.10ms | 200ms | 0.00042ms | PASS | stable (p10 +5% (閾値未満)、 p95 +88% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.19ms | 0.27ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.04ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.19ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.25ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.16ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 5432 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 265952 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.10ms |
| p99 | 0.15ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.16ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0017ms | +4.63% |
| p50 | 0.05ms | 0.04ms | +0.0023ms | +5.29% |
| p95 | 0.10ms | 0.06ms | +0.05ms | +87.85% |
| p99 | 0.15ms | 0.08ms | +0.07ms | +86.09% |
| mean | 0.05ms | 0.05ms | +0.0084ms | +18.29% |
| min | 0.03ms | 0.03ms | +0.00092ms | +2.70% |
| max | 0.16ms | 0.09ms | +0.07ms | +85.80% |
| total | 1.09ms | 0.92ms | +0.17ms | +18.29% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.19ms |
| p50 | 0.24ms |
| p95 | 0.27ms |
| p99 | 0.41ms |
| mean | 0.24ms |
| stdev | 0.05ms |
| min | 0.19ms |
| max | 0.44ms |
| total | 4.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.19ms | 0.24ms | -0.05ms | -19.60% |
| p50 | 0.24ms | 0.29ms | -0.04ms | -14.70% |
| p95 | 0.27ms | 0.32ms | -0.05ms | -14.73% |
| p99 | 0.41ms | 0.38ms | +0.02ms | +6.30% |
| mean | 0.24ms | 0.28ms | -0.04ms | -14.42% |
| min | 0.19ms | 0.23ms | -0.04ms | -16.80% |
| max | 0.44ms | 0.40ms | +0.04ms | +10.52% |
| total | 4.87ms | 5.69ms | -0.82ms | -14.42% |

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
| mean | 0.03ms |
| stdev | 0.0022ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0041ms | -11.13% |
| p50 | 0.03ms | 0.04ms | -0.0076ms | -18.44% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -22.92% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -30.67% |
| mean | 0.03ms | 0.04ms | -0.0084ms | -19.59% |
| min | 0.03ms | 0.04ms | -0.0062ms | -17.15% |
| max | 0.04ms | 0.06ms | -0.02ms | -32.36% |
| total | 0.69ms | 0.86ms | -0.17ms | -19.59% |

