# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.12ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.06ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 54776 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 36552 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0040ms | -13.40% |
| p50 | 0.03ms | 0.03ms | -0.0041ms | -11.73% |
| p95 | 0.05ms | 0.05ms | +0.0020ms | +4.53% |
| p99 | 0.07ms | 0.06ms | +0.02ms | +31.97% |
| mean | 0.03ms | 0.04ms | -0.0016ms | -4.51% |
| min | 0.03ms | 0.03ms | -0.0017ms | -6.26% |
| max | 0.08ms | 0.06ms | +0.02ms | +37.24% |
| total | 0.69ms | 0.72ms | -0.03ms | -4.51% |

### mutation_batch (5 createUser mutations)

# Perf Report — mutation_batch (5 createUser mutations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0017ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0014ms | +11.08% |
| p50 | 0.02ms | 0.01ms | +0.0015ms | +11.18% |
| p95 | 0.02ms | 0.16ms | -0.14ms | -87.40% |
| p99 | 0.02ms | 0.22ms | -0.20ms | -90.73% |
| mean | 0.02ms | 0.03ms | -0.02ms | -53.46% |
| min | 0.01ms | 0.01ms | +0.0014ms | +11.22% |
| max | 0.02ms | 0.23ms | -0.21ms | -91.28% |
| total | 0.32ms | 0.68ms | -0.36ms | -53.46% |

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
| stdev | 0.0028ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00042ms | -1.92% |
| p50 | 0.02ms | 0.02ms | -0.00044ms | -1.93% |
| p95 | 0.03ms | 0.03ms | +0.0034ms | +13.23% |
| p99 | 0.03ms | 0.03ms | +0.0016ms | +5.40% |
| mean | 0.02ms | 0.02ms | +0.000071ms | +0.30% |
| min | 0.02ms | 0.02ms | -0.00075ms | -3.45% |
| max | 0.03ms | 0.03ms | +0.0011ms | +3.72% |
| total | 0.47ms | 0.47ms | +0.0014ms | +0.30% |

