# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.55ms | 2.98ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.35ms | 0.70ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.36ms | 0.67ms | 300ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.36ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.21ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.96ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 6592 B | 3842 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -4968 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -2056 B | 16644 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.55ms |
| p50 | 1.98ms |
| p95 | 2.98ms |
| p99 | 3.41ms |
| mean | 2.04ms |
| stdev | 0.51ms |
| min | 1.34ms |
| max | 3.52ms |
| total | 61.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.55ms | 1.68ms | -0.13ms | -7.51% |
| p50 | 1.98ms | 2.06ms | -0.08ms | -4.07% |
| p95 | 2.98ms | 3.09ms | -0.11ms | -3.54% |
| p99 | 3.41ms | 3.47ms | -0.06ms | -1.84% |
| mean | 2.04ms | 2.13ms | -0.08ms | -3.88% |
| min | 1.34ms | 1.26ms | +0.09ms | +6.85% |
| max | 3.52ms | 3.50ms | +0.01ms | +0.38% |
| total | 61.33ms | 63.81ms | -2.48ms | -3.88% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.37ms |
| p95 | 0.70ms |
| p99 | 0.75ms |
| mean | 0.41ms |
| stdev | 0.11ms |
| min | 0.35ms |
| max | 0.75ms |
| total | 12.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.35ms | +0.0072ms | +2.08% |
| p50 | 0.37ms | 0.37ms | +0.00046ms | +0.12% |
| p95 | 0.70ms | 0.63ms | +0.06ms | +9.67% |
| p99 | 0.75ms | 0.83ms | -0.09ms | -10.31% |
| mean | 0.41ms | 0.42ms | -0.0066ms | -1.58% |
| min | 0.35ms | 0.32ms | +0.03ms | +8.20% |
| max | 0.75ms | 0.89ms | -0.13ms | -15.15% |
| total | 12.35ms | 12.55ms | -0.20ms | -1.58% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.50ms |
| p95 | 0.67ms |
| p99 | 0.70ms |
| mean | 0.49ms |
| stdev | 0.10ms |
| min | 0.35ms |
| max | 0.71ms |
| total | 14.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.36ms | +0.0053ms | +1.49% |
| p50 | 0.50ms | 0.40ms | +0.10ms | +25.67% |
| p95 | 0.67ms | 0.75ms | -0.08ms | -10.92% |
| p99 | 0.70ms | 0.81ms | -0.11ms | -13.43% |
| mean | 0.49ms | 0.47ms | +0.02ms | +4.56% |
| min | 0.35ms | 0.35ms | -0.0021ms | -0.60% |
| max | 0.71ms | 0.83ms | -0.12ms | -14.89% |
| total | 14.61ms | 13.97ms | +0.64ms | +4.56% |

