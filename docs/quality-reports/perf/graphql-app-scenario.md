# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.12ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 55920 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 38544 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -1048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### query_workflow (10 client.query with variables)

# Perf Report — query_workflow (10 client.query with variables).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0032ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0023ms | -7.67% |
| p50 | 0.03ms | 0.03ms | -0.0051ms | -14.65% |
| p95 | 0.04ms | 0.05ms | -0.0097ms | -21.62% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -31.86% |
| mean | 0.03ms | 0.04ms | -0.0057ms | -15.81% |
| min | 0.03ms | 0.03ms | -0.0022ms | -8.24% |
| max | 0.04ms | 0.06ms | -0.02ms | -33.83% |
| total | 0.61ms | 0.72ms | -0.11ms | -15.81% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0016ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0012ms | +9.45% |
| p50 | 0.01ms | 0.01ms | +0.0012ms | +8.45% |
| p95 | 0.02ms | 0.16ms | -0.14ms | -88.21% |
| p99 | 0.02ms | 0.22ms | -0.20ms | -91.43% |
| mean | 0.02ms | 0.03ms | -0.02ms | -54.20% |
| min | 0.01ms | 0.01ms | +0.0013ms | +10.56% |
| max | 0.02ms | 0.23ms | -0.21ms | -91.96% |
| total | 0.31ms | 0.68ms | -0.37ms | -54.20% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0026ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00067ms | +3.06% |
| p50 | 0.02ms | 0.02ms | +0.0017ms | +7.63% |
| p95 | 0.03ms | 0.03ms | +0.0050ms | +19.33% |
| p99 | 0.03ms | 0.03ms | +0.0018ms | +6.14% |
| mean | 0.03ms | 0.02ms | +0.0018ms | +7.80% |
| min | 0.02ms | 0.02ms | +0.00025ms | +1.15% |
| max | 0.03ms | 0.03ms | +0.0010ms | +3.31% |
| total | 0.50ms | 0.47ms | +0.04ms | +7.80% |

