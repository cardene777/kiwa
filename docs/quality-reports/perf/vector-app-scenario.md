# Perf Suite — vector-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.04ms | 0.06ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| batch_upsert_1000 (chunked upsertVectors) | 0.22ms | 0.43ms | 200ms | 0.00050ms | PASS | stable (p10 -9% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| query_error_handling (5 dimension mismatch throw + catch) | 0.03ms | 0.04ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | 0.22ms | 400ms | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 1.13ms | 400ms | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 0.17ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rag_workflow (upsert 10 + query 3 across 4 providers) | -14352 B | -10139 B | 102400 B | yes | PASS |
| batch_upsert_1000 (chunked upsertVectors) | 276640 B | 0 B | 102400 B | yes | PASS |
| query_error_handling (5 dimension mismatch throw + catch) | 64 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rag_workflow (upsert 10 + query 3 across 4 providers)

# Perf Report — rag_workflow (upsert 10 + query 3 across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0078ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0050ms | +13.30% |
| p50 | 0.05ms | 0.04ms | +0.0049ms | +11.21% |
| p95 | 0.06ms | 0.06ms | +0.0065ms | +11.68% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -21.37% |
| mean | 0.05ms | 0.05ms | +0.0033ms | +7.09% |
| min | 0.04ms | 0.03ms | +0.0024ms | +7.11% |
| max | 0.06ms | 0.09ms | -0.02ms | -26.74% |
| total | 0.98ms | 0.92ms | +0.07ms | +7.09% |

### batch_upsert_1000 (chunked upsertVectors)

# Perf Report — batch_upsert_1000 (chunked upsertVectors).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.22ms |
| p50 | 0.26ms |
| p95 | 0.43ms |
| p99 | 0.45ms |
| mean | 0.28ms |
| stdev | 0.07ms |
| min | 0.21ms |
| max | 0.45ms |
| total | 5.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.22ms | 0.24ms | -0.02ms | -9.42% |
| p50 | 0.26ms | 0.29ms | -0.02ms | -7.96% |
| p95 | 0.43ms | 0.32ms | +0.11ms | +34.15% |
| p99 | 0.45ms | 0.38ms | +0.07ms | +17.62% |
| mean | 0.28ms | 0.28ms | -0.0030ms | -1.05% |
| min | 0.21ms | 0.23ms | -0.02ms | -8.09% |
| max | 0.45ms | 0.40ms | +0.06ms | +14.31% |
| total | 5.63ms | 5.69ms | -0.06ms | -1.05% |

### query_error_handling (5 dimension mismatch throw + catch)

# Perf Report — query_error_handling (5 dimension mismatch throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0054ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0060ms | -16.25% |
| p50 | 0.04ms | 0.04ms | -0.0053ms | -12.87% |
| p95 | 0.04ms | 0.05ms | -0.0085ms | -16.81% |
| p99 | 0.05ms | 0.06ms | -0.0039ms | -6.87% |
| mean | 0.04ms | 0.04ms | -0.0059ms | -13.71% |
| min | 0.03ms | 0.04ms | -0.0052ms | -14.49% |
| max | 0.06ms | 0.06ms | -0.0028ms | -4.71% |
| total | 0.74ms | 0.86ms | -0.12ms | -13.71% |

