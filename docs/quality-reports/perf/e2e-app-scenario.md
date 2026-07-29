# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.47ms | 2.93ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.35ms | 0.53ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.37ms | 0.69ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 6.19ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.51ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.41ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5232 B | 9673 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -5616 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -2424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.47ms |
| p50 | 1.74ms |
| p95 | 2.93ms |
| p99 | 2.98ms |
| mean | 1.91ms |
| stdev | 0.50ms |
| min | 1.21ms |
| max | 2.98ms |
| total | 57.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.47ms | 1.68ms | -0.21ms | -12.61% |
| p50 | 1.74ms | 2.06ms | -0.33ms | -15.82% |
| p95 | 2.93ms | 3.09ms | -0.15ms | -4.95% |
| p99 | 2.98ms | 3.47ms | -0.49ms | -14.14% |
| mean | 1.91ms | 2.13ms | -0.21ms | -10.01% |
| min | 1.21ms | 1.26ms | -0.05ms | -3.70% |
| max | 2.98ms | 3.50ms | -0.52ms | -14.94% |
| total | 57.42ms | 63.81ms | -6.39ms | -10.01% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.36ms |
| p95 | 0.53ms |
| p99 | 0.72ms |
| mean | 0.39ms |
| stdev | 0.09ms |
| min | 0.34ms |
| max | 0.78ms |
| total | 11.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.35ms | -0.000059ms | -0.02% |
| p50 | 0.36ms | 0.37ms | -0.01ms | -2.93% |
| p95 | 0.53ms | 0.63ms | -0.10ms | -15.89% |
| p99 | 0.72ms | 0.83ms | -0.12ms | -14.12% |
| mean | 0.39ms | 0.42ms | -0.03ms | -6.92% |
| min | 0.34ms | 0.32ms | +0.01ms | +4.23% |
| max | 0.78ms | 0.89ms | -0.11ms | -11.91% |
| total | 11.68ms | 12.55ms | -0.87ms | -6.92% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.37ms |
| p50 | 0.44ms |
| p95 | 0.69ms |
| p99 | 0.73ms |
| mean | 0.47ms |
| stdev | 0.11ms |
| min | 0.36ms |
| max | 0.73ms |
| total | 14.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.36ms | +0.02ms | +5.05% |
| p50 | 0.44ms | 0.40ms | +0.04ms | +9.22% |
| p95 | 0.69ms | 0.75ms | -0.06ms | -7.61% |
| p99 | 0.73ms | 0.81ms | -0.08ms | -10.40% |
| mean | 0.47ms | 0.47ms | +0.0049ms | +1.06% |
| min | 0.36ms | 0.35ms | +0.01ms | +2.97% |
| max | 0.73ms | 0.83ms | -0.10ms | -11.63% |
| total | 14.12ms | 13.97ms | +0.15ms | +1.06% |

