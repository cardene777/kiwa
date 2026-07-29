# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 +19% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.36ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.13ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 60824 B | -10636 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 39336 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -1576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.17ms |
| mean | 0.04ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.20ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00030ms | +1.00% |
| p50 | 0.03ms | 0.03ms | -0.0027ms | -7.62% |
| p95 | 0.05ms | 0.05ms | +0.0095ms | +21.08% |
| p99 | 0.17ms | 0.06ms | +0.12ms | +207.18% |
| mean | 0.04ms | 0.04ms | +0.0059ms | +16.37% |
| min | 0.03ms | 0.03ms | +0.0030ms | +10.84% |
| max | 0.20ms | 0.06ms | +0.14ms | +242.93% |
| total | 0.84ms | 0.72ms | +0.12ms | +16.37% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0047ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0032ms | +25.06% |
| p50 | 0.02ms | 0.01ms | +0.0037ms | +26.73% |
| p95 | 0.02ms | 0.16ms | -0.13ms | -86.11% |
| p99 | 0.03ms | 0.22ms | -0.18ms | -84.08% |
| mean | 0.02ms | 0.03ms | -0.02ms | -45.02% |
| min | 0.02ms | 0.01ms | +0.0031ms | +24.75% |
| max | 0.04ms | 0.23ms | -0.20ms | -83.74% |
| total | 0.38ms | 0.68ms | -0.31ms | -45.02% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0034ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0041ms | +18.86% |
| p50 | 0.03ms | 0.02ms | +0.0054ms | +23.64% |
| p95 | 0.03ms | 0.03ms | +0.0083ms | +31.98% |
| p99 | 0.04ms | 0.03ms | +0.0086ms | +29.16% |
| mean | 0.03ms | 0.02ms | +0.0058ms | +25.08% |
| min | 0.03ms | 0.02ms | +0.0036ms | +16.47% |
| max | 0.04ms | 0.03ms | +0.0086ms | +28.55% |
| total | 0.58ms | 0.47ms | +0.12ms | +25.08% |

