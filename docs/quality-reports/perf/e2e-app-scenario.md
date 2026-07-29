# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.33ms | 2.58ms | 300ms | 0.00059ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.33ms | 0.63ms | 300ms | 0.00059ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.35ms | 0.58ms | 300ms | 0.00059ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | cpu | 0.08ms | 1.33ms | 16.137 | 17.442 | 1.34ms | 1.45ms |
| concurrent_read_batch (5 GET via Promise.all) | cpu | 0.08ms | 0.33ms | 4.114 | 4.580 | 0.34ms | 0.38ms |
| server_error_handling (5 GET /fail 500 responses) | cpu | 0.08ms | 0.35ms | 4.365 | 4.589 | 0.36ms | 0.38ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.26ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.10ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.36ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 6944 B | -14197 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -4376 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -752 B | 8874 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.33ms |
| p50 | 1.83ms |
| p95 | 2.58ms |
| p99 | 2.64ms |
| mean | 1.91ms |
| stdev | 0.42ms |
| min | 1.21ms |
| max | 2.67ms |
| total | 57.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.33ms | 1.45ms | -0.12ms | -8.13% |
| p50 | 1.83ms | 2.09ms | -0.25ms | -12.20% |
| p95 | 2.58ms | 3.10ms | -0.51ms | -16.56% |
| p99 | 2.64ms | 3.55ms | -0.91ms | -25.54% |
| mean | 1.91ms | 2.18ms | -0.28ms | -12.67% |
| min | 1.21ms | 1.24ms | -0.03ms | -2.12% |
| max | 2.67ms | 3.72ms | -1.05ms | -28.28% |
| total | 57.20ms | 65.50ms | -8.30ms | -12.67% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.33ms |
| p50 | 0.35ms |
| p95 | 0.63ms |
| p99 | 0.71ms |
| mean | 0.39ms |
| stdev | 0.10ms |
| min | 0.31ms |
| max | 0.72ms |
| total | 11.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.33ms | 0.38ms | -0.05ms | -11.98% |
| p50 | 0.35ms | 0.44ms | -0.09ms | -20.11% |
| p95 | 0.63ms | 0.85ms | -0.22ms | -26.03% |
| p99 | 0.71ms | 0.97ms | -0.26ms | -26.91% |
| mean | 0.39ms | 0.51ms | -0.12ms | -23.84% |
| min | 0.31ms | 0.35ms | -0.04ms | -11.14% |
| max | 0.72ms | 0.99ms | -0.28ms | -27.90% |
| total | 11.69ms | 15.34ms | -3.66ms | -23.84% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.39ms |
| p95 | 0.58ms |
| p99 | 0.73ms |
| mean | 0.43ms |
| stdev | 0.09ms |
| min | 0.34ms |
| max | 0.78ms |
| total | 12.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.38ms | -0.02ms | -5.57% |
| p50 | 0.39ms | 0.51ms | -0.12ms | -23.29% |
| p95 | 0.58ms | 0.80ms | -0.22ms | -27.38% |
| p99 | 0.73ms | 0.91ms | -0.19ms | -20.39% |
| mean | 0.43ms | 0.54ms | -0.11ms | -21.02% |
| min | 0.34ms | 0.37ms | -0.02ms | -6.46% |
| max | 0.78ms | 0.94ms | -0.16ms | -17.20% |
| total | 12.89ms | 16.32ms | -3.43ms | -21.02% |

