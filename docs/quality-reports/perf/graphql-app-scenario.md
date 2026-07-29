# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.12ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.06ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 54584 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 286048 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -904 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0036ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0031ms | -10.43% |
| p50 | 0.03ms | 0.03ms | -0.0068ms | -19.48% |
| p95 | 0.04ms | 0.05ms | -0.0079ms | -17.51% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -32.57% |
| mean | 0.03ms | 0.04ms | -0.0066ms | -18.27% |
| min | 0.02ms | 0.03ms | -0.0025ms | -9.16% |
| max | 0.04ms | 0.06ms | -0.02ms | -35.47% |
| total | 0.59ms | 0.72ms | -0.13ms | -18.27% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0022ms | +16.88% |
| p50 | 0.02ms | 0.01ms | +0.0024ms | +17.37% |
| p95 | 0.03ms | 0.16ms | -0.13ms | -83.05% |
| p99 | 0.07ms | 0.22ms | -0.15ms | -66.83% |
| mean | 0.02ms | 0.03ms | -0.01ms | -41.22% |
| min | 0.01ms | 0.01ms | +0.0019ms | +15.18% |
| max | 0.08ms | 0.23ms | -0.15ms | -64.14% |
| total | 0.40ms | 0.68ms | -0.28ms | -41.22% |

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
| mean | 0.02ms |
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -5.17% |
| p50 | 0.02ms | 0.02ms | -0.00090ms | -3.96% |
| p95 | 0.03ms | 0.03ms | +0.0019ms | +7.21% |
| p99 | 0.03ms | 0.03ms | +0.0017ms | +5.82% |
| mean | 0.02ms | 0.02ms | -0.00042ms | -1.79% |
| min | 0.02ms | 0.02ms | -0.0018ms | -8.43% |
| max | 0.03ms | 0.03ms | +0.0017ms | +5.52% |
| total | 0.46ms | 0.47ms | -0.0083ms | -1.79% |

