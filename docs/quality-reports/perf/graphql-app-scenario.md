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
| query_workflow (10 client.query with variables) | 0.14ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 9184 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 36648 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -552 B | 0 B | 102400 B | yes | PASS |

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
| min | 0.03ms |
| max | 0.04ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0015ms | -4.82% |
| p50 | 0.03ms | 0.03ms | -0.0055ms | -15.72% |
| p95 | 0.04ms | 0.05ms | -0.0057ms | -12.67% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -29.41% |
| mean | 0.03ms | 0.04ms | -0.0051ms | -14.04% |
| min | 0.03ms | 0.03ms | -0.00050ms | -1.83% |
| max | 0.04ms | 0.06ms | -0.02ms | -32.62% |
| total | 0.62ms | 0.72ms | -0.10ms | -14.04% |

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
| mean | 0.01ms |
| stdev | 0.0022ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00074ms | -5.83% |
| p50 | 0.01ms | 0.01ms | +0.00052ms | +3.77% |
| p95 | 0.02ms | 0.16ms | -0.14ms | -88.76% |
| p99 | 0.02ms | 0.22ms | -0.20ms | -90.80% |
| mean | 0.01ms | 0.03ms | -0.02ms | -58.47% |
| min | 0.01ms | 0.01ms | -0.00058ms | -4.63% |
| max | 0.02ms | 0.23ms | -0.21ms | -91.14% |
| total | 0.28ms | 0.68ms | -0.40ms | -58.47% |

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
| stdev | 0.0029ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00048ms | -2.19% |
| p50 | 0.02ms | 0.02ms | -0.00021ms | -0.92% |
| p95 | 0.03ms | 0.03ms | +0.0032ms | +12.25% |
| p99 | 0.03ms | 0.03ms | +0.0019ms | +6.48% |
| mean | 0.02ms | 0.02ms | +0.00020ms | +0.84% |
| min | 0.02ms | 0.02ms | -0.00058ms | -2.69% |
| max | 0.03ms | 0.03ms | +0.0016ms | +5.24% |
| total | 0.47ms | 0.47ms | +0.0039ms | +0.84% |

