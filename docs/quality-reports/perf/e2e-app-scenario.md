# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.35ms | 2.60ms | 300ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.35ms | 0.60ms | 300ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.36ms | 0.67ms | 300ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.86ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.09ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.93ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 848 B | 4570 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -440 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -11096 B | 8874 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.35ms |
| p50 | 1.94ms |
| p95 | 2.60ms |
| p99 | 2.84ms |
| mean | 1.93ms |
| stdev | 0.45ms |
| min | 1.14ms |
| max | 2.90ms |
| total | 57.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.35ms | 1.68ms | -0.33ms | -19.58% |
| p50 | 1.94ms | 2.06ms | -0.12ms | -5.79% |
| p95 | 2.60ms | 3.09ms | -0.49ms | -15.73% |
| p99 | 2.84ms | 3.47ms | -0.63ms | -18.28% |
| mean | 1.93ms | 2.13ms | -0.20ms | -9.32% |
| min | 1.14ms | 1.26ms | -0.11ms | -8.92% |
| max | 2.90ms | 3.50ms | -0.60ms | -17.10% |
| total | 57.86ms | 63.81ms | -5.95ms | -9.32% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.41ms |
| p95 | 0.60ms |
| p99 | 0.66ms |
| mean | 0.42ms |
| stdev | 0.08ms |
| min | 0.33ms |
| max | 0.68ms |
| total | 12.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.35ms | +0.00018ms | +0.05% |
| p50 | 0.41ms | 0.37ms | +0.04ms | +10.02% |
| p95 | 0.60ms | 0.63ms | -0.04ms | -5.81% |
| p99 | 0.66ms | 0.83ms | -0.17ms | -20.27% |
| mean | 0.42ms | 0.42ms | +0.0062ms | +1.49% |
| min | 0.33ms | 0.32ms | +0.0068ms | +2.11% |
| max | 0.68ms | 0.89ms | -0.21ms | -23.33% |
| total | 12.74ms | 12.55ms | +0.19ms | +1.49% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.39ms |
| p95 | 0.67ms |
| p99 | 0.78ms |
| mean | 0.46ms |
| stdev | 0.12ms |
| min | 0.34ms |
| max | 0.83ms |
| total | 13.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.36ms | +0.0055ms | +1.53% |
| p50 | 0.39ms | 0.40ms | -0.0037ms | -0.93% |
| p95 | 0.67ms | 0.75ms | -0.08ms | -10.38% |
| p99 | 0.78ms | 0.81ms | -0.03ms | -3.94% |
| mean | 0.46ms | 0.47ms | -0.0081ms | -1.74% |
| min | 0.34ms | 0.35ms | -0.0078ms | -2.23% |
| max | 0.83ms | 0.83ms | -0.0035ms | -0.43% |
| total | 13.73ms | 13.97ms | -0.24ms | -1.74% |

