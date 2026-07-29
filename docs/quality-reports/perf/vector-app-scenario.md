# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.03ms | 0.05ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.20ms | 0.34ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.04ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.15ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.11ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.17ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | -7400 B | 0 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 276784 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | -192 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0064ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0026ms | -6.91% |
| p50 | 0.04ms | 0.04ms | -0.0014ms | -3.22% |
| p95 | 0.05ms | 0.06ms | -0.0030ms | -5.40% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -27.05% |
| mean | 0.04ms | 0.05ms | -0.0029ms | -6.39% |
| min | 0.03ms | 0.03ms | +0.000083ms | +0.24% |
| max | 0.06ms | 0.09ms | -0.03ms | -30.57% |
| total | 0.86ms | 0.92ms | -0.06ms | -6.39% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.20ms |
| p50 | 0.27ms |
| p95 | 0.34ms |
| p99 | 0.47ms |
| mean | 0.27ms |
| stdev | 0.07ms |
| min | 0.20ms |
| max | 0.51ms |
| total | 5.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.20ms | 0.24ms | -0.04ms | -16.52% |
| p50 | 0.27ms | 0.29ms | -0.02ms | -6.31% |
| p95 | 0.34ms | 0.32ms | +0.02ms | +6.82% |
| p99 | 0.47ms | 0.38ms | +0.09ms | +24.48% |
| mean | 0.27ms | 0.28ms | -0.01ms | -4.84% |
| min | 0.20ms | 0.23ms | -0.04ms | -15.44% |
| max | 0.51ms | 0.40ms | +0.11ms | +28.03% |
| total | 5.41ms | 5.69ms | -0.27ms | -4.84% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0057ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0032ms | -8.54% |
| p50 | 0.04ms | 0.04ms | -0.0057ms | -13.77% |
| p95 | 0.04ms | 0.05ms | -0.0064ms | -12.69% |
| p99 | 0.06ms | 0.06ms | -0.0017ms | -3.03% |
| mean | 0.04ms | 0.04ms | -0.0055ms | -12.85% |
| min | 0.03ms | 0.04ms | -0.0066ms | -18.31% |
| max | 0.06ms | 0.06ms | -0.00054ms | -0.93% |
| total | 0.75ms | 0.86ms | -0.11ms | -12.85% |

