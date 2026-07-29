# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00033ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00067ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 1.73ms | 3.24ms | 300ms | 0.00067ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 0.40ms | 0.92ms | 300ms | 0.00067ms | PASS | stable (p10 +14% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 0.42ms | 1.05ms | 300ms | 0.00067ms | PASS | stable (p10 +18% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7.54ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 3.56ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 2.03ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5672 B | -36506 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -2800 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -3800 B | 190 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 1.73ms |
| p50 | 2.31ms |
| p95 | 3.24ms |
| p99 | 3.32ms |
| mean | 2.36ms |
| stdev | 0.56ms |
| min | 1.58ms |
| max | 3.35ms |
| total | 70.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.73ms | 1.68ms | +0.05ms | +3.17% |
| p50 | 2.31ms | 2.06ms | +0.24ms | +11.77% |
| p95 | 3.24ms | 3.09ms | +0.15ms | +4.95% |
| p99 | 3.32ms | 3.47ms | -0.15ms | -4.34% |
| mean | 2.36ms | 2.13ms | +0.23ms | +10.96% |
| min | 1.58ms | 1.26ms | +0.32ms | +25.62% |
| max | 3.35ms | 3.50ms | -0.15ms | -4.41% |
| total | 70.80ms | 63.81ms | +6.99ms | +10.96% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.40ms |
| p50 | 0.41ms |
| p95 | 0.92ms |
| p99 | 1.27ms |
| mean | 0.48ms |
| stdev | 0.21ms |
| min | 0.38ms |
| max | 1.37ms |
| total | 14.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.40ms | 0.35ms | +0.05ms | +14.00% |
| p50 | 0.41ms | 0.37ms | +0.04ms | +12.16% |
| p95 | 0.92ms | 0.63ms | +0.28ms | +44.40% |
| p99 | 1.27ms | 0.83ms | +0.44ms | +52.33% |
| mean | 0.48ms | 0.42ms | +0.06ms | +14.75% |
| min | 0.38ms | 0.32ms | +0.06ms | +17.56% |
| max | 1.37ms | 0.89ms | +0.48ms | +53.83% |
| total | 14.40ms | 12.55ms | +1.85ms | +14.75% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.54ms |
| p95 | 1.05ms |
| p99 | 1.14ms |
| mean | 0.61ms |
| stdev | 0.22ms |
| min | 0.36ms |
| max | 1.16ms |
| total | 18.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.42ms | 0.36ms | +0.06ms | +18.18% |
| p50 | 0.54ms | 0.40ms | +0.14ms | +34.54% |
| p95 | 1.05ms | 0.75ms | +0.30ms | +40.26% |
| p99 | 1.14ms | 0.81ms | +0.33ms | +40.56% |
| mean | 0.61ms | 0.47ms | +0.14ms | +30.88% |
| min | 0.36ms | 0.35ms | +0.0089ms | +2.54% |
| max | 1.16ms | 0.83ms | +0.33ms | +40.10% |
| total | 18.29ms | 13.97ms | +4.31ms | +30.88% |

