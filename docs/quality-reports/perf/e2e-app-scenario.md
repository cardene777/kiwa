# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.34ms | 2.91ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.34ms | 0.66ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.43ms | 0.76ms | 300ms | 0.00058ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.87ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.12ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 2.02ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 6576 B | -22674 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -3952 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.34ms |
| p50 | 1.98ms |
| p95 | 2.91ms |
| p99 | 3.31ms |
| mean | 2.06ms |
| stdev | 0.58ms |
| min | 1.05ms |
| max | 3.46ms |
| total | 61.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.34ms | 1.68ms | -0.34ms | -20.03% |
| p50 | 1.98ms | 2.06ms | -0.08ms | -4.12% |
| p95 | 2.91ms | 3.09ms | -0.17ms | -5.64% |
| p99 | 3.31ms | 3.47ms | -0.16ms | -4.65% |
| mean | 2.06ms | 2.13ms | -0.07ms | -3.28% |
| min | 1.05ms | 1.26ms | -0.21ms | -16.42% |
| max | 3.46ms | 3.50ms | -0.04ms | -1.22% |
| total | 61.71ms | 63.81ms | -2.09ms | -3.28% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.34ms |
| p50 | 0.37ms |
| p95 | 0.66ms |
| p99 | 0.69ms |
| mean | 0.41ms |
| stdev | 0.11ms |
| min | 0.33ms |
| max | 0.69ms |
| total | 12.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.34ms | 0.35ms | -0.0050ms | -1.43% |
| p50 | 0.37ms | 0.37ms | -0.0035ms | -0.96% |
| p95 | 0.66ms | 0.63ms | +0.02ms | +3.30% |
| p99 | 0.69ms | 0.83ms | -0.14ms | -16.80% |
| mean | 0.41ms | 0.42ms | -0.0043ms | -1.02% |
| min | 0.33ms | 0.32ms | +0.0085ms | +2.63% |
| max | 0.69ms | 0.89ms | -0.19ms | -21.89% |
| total | 12.42ms | 12.55ms | -0.13ms | -1.02% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.43ms |
| p50 | 0.52ms |
| p95 | 0.76ms |
| p99 | 0.82ms |
| mean | 0.56ms |
| stdev | 0.12ms |
| min | 0.40ms |
| max | 0.84ms |
| total | 16.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.43ms | 0.36ms | +0.07ms | +20.77% |
| p50 | 0.52ms | 0.40ms | +0.12ms | +30.60% |
| p95 | 0.76ms | 0.75ms | +0.0090ms | +1.21% |
| p99 | 0.82ms | 0.81ms | +0.0098ms | +1.20% |
| mean | 0.56ms | 0.47ms | +0.09ms | +19.22% |
| min | 0.40ms | 0.35ms | +0.05ms | +12.99% |
| max | 0.84ms | 0.83ms | +0.01ms | +1.77% |
| total | 16.66ms | 13.97ms | +2.69ms | +19.22% |

