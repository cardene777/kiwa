# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.22ms | 2.65ms | 300ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.34ms | 0.54ms | 300ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.36ms | 0.64ms | 300ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.95ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.61ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.49ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 736 B | 10869 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -1752 B | -9479 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -10984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.22ms |
| p50 | 1.79ms |
| p95 | 2.65ms |
| p99 | 2.78ms |
| mean | 1.77ms |
| stdev | 0.48ms |
| min | 0.97ms |
| max | 2.79ms |
| total | 53.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.22ms | 1.68ms | -0.46ms | -27.45% |
| p50 | 1.79ms | 2.06ms | -0.28ms | -13.34% |
| p95 | 2.65ms | 3.09ms | -0.44ms | -14.25% |
| p99 | 2.78ms | 3.47ms | -0.69ms | -19.91% |
| mean | 1.77ms | 2.13ms | -0.35ms | -16.61% |
| min | 0.97ms | 1.26ms | -0.28ms | -22.39% |
| max | 2.79ms | 3.50ms | -0.71ms | -20.37% |
| total | 53.21ms | 63.81ms | -10.60ms | -16.61% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.34ms |
| p50 | 0.36ms |
| p95 | 0.54ms |
| p99 | 0.67ms |
| mean | 0.38ms |
| stdev | 0.08ms |
| min | 0.34ms |
| max | 0.69ms |
| total | 11.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.34ms | 0.35ms | -0.0055ms | -1.57% |
| p50 | 0.36ms | 0.37ms | -0.01ms | -3.64% |
| p95 | 0.54ms | 0.63ms | -0.10ms | -15.05% |
| p99 | 0.67ms | 0.83ms | -0.16ms | -19.58% |
| mean | 0.38ms | 0.42ms | -0.04ms | -9.70% |
| min | 0.34ms | 0.32ms | +0.01ms | +4.00% |
| max | 0.69ms | 0.89ms | -0.20ms | -22.08% |
| total | 11.33ms | 12.55ms | -1.22ms | -9.70% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.47ms |
| p95 | 0.64ms |
| p99 | 0.73ms |
| mean | 0.48ms |
| stdev | 0.11ms |
| min | 0.36ms |
| max | 0.76ms |
| total | 14.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.36ms | +0.0044ms | +1.24% |
| p50 | 0.47ms | 0.40ms | +0.07ms | +18.55% |
| p95 | 0.64ms | 0.75ms | -0.11ms | -14.28% |
| p99 | 0.73ms | 0.81ms | -0.09ms | -10.61% |
| mean | 0.48ms | 0.47ms | +0.02ms | +3.73% |
| min | 0.36ms | 0.35ms | +0.0065ms | +1.86% |
| max | 0.76ms | 0.83ms | -0.07ms | -9.00% |
| total | 14.50ms | 13.97ms | +0.52ms | +3.73% |

