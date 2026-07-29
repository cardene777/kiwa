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
| query_workflow (10 client.query with variables) | 0.13ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 56560 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 36056 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.0086ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0023ms | -7.69% |
| p50 | 0.03ms | 0.03ms | -0.0051ms | -14.65% |
| p95 | 0.05ms | 0.05ms | +0.0035ms | +7.87% |
| p99 | 0.06ms | 0.06ms | +0.0036ms | +6.40% |
| mean | 0.03ms | 0.04ms | -0.0029ms | -8.08% |
| min | 0.03ms | 0.03ms | -0.0010ms | -3.66% |
| max | 0.06ms | 0.06ms | +0.0036ms | +6.11% |
| total | 0.66ms | 0.72ms | -0.06ms | -8.08% |

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
| mean | 0.01ms |
| stdev | 0.0020ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00050ms | -3.88% |
| p50 | 0.02ms | 0.01ms | +0.0013ms | +9.21% |
| p95 | 0.02ms | 0.16ms | -0.14ms | -88.58% |
| p99 | 0.02ms | 0.22ms | -0.20ms | -91.54% |
| mean | 0.01ms | 0.03ms | -0.02ms | -57.61% |
| min | 0.01ms | 0.01ms | -0.00038ms | -2.97% |
| max | 0.02ms | 0.23ms | -0.22ms | -92.03% |
| total | 0.29ms | 0.68ms | -0.39ms | -57.61% |

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
| stdev | 0.0027ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -4.96% |
| p50 | 0.02ms | 0.02ms | -0.00027ms | -1.20% |
| p95 | 0.03ms | 0.03ms | +0.0014ms | +5.50% |
| p99 | 0.03ms | 0.03ms | +0.0015ms | +5.06% |
| mean | 0.02ms | 0.02ms | -0.00024ms | -1.02% |
| min | 0.02ms | 0.02ms | -0.0014ms | -6.51% |
| max | 0.03ms | 0.03ms | +0.0015ms | +4.97% |
| total | 0.46ms | 0.47ms | -0.0047ms | -1.02% |

