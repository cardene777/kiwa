# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.04ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.01ms | 0.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.03ms | 100ms | 0.0012ms | PASS | stable (p10 +9% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.12ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 55656 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 39024 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -600 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0050ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0016ms | -5.23% |
| p50 | 0.03ms | 0.03ms | -0.0055ms | -15.78% |
| p95 | 0.04ms | 0.05ms | -0.0017ms | -3.83% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -19.40% |
| mean | 0.03ms | 0.04ms | -0.0041ms | -11.49% |
| min | 0.03ms | 0.03ms | +0.0011ms | +4.12% |
| max | 0.05ms | 0.06ms | -0.01ms | -22.39% |
| total | 0.64ms | 0.72ms | -0.08ms | -11.49% |

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
| stdev | 0.0023ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00087ms | -6.80% |
| p50 | 0.01ms | 0.01ms | -0.00056ms | -4.08% |
| p95 | 0.02ms | 0.16ms | -0.14ms | -87.73% |
| p99 | 0.02ms | 0.22ms | -0.20ms | -91.05% |
| mean | 0.01ms | 0.03ms | -0.02ms | -59.23% |
| min | 0.01ms | 0.01ms | -0.00075ms | -5.94% |
| max | 0.02ms | 0.23ms | -0.21ms | -91.60% |
| total | 0.28ms | 0.68ms | -0.40ms | -59.23% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0026ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0020ms | +9.35% |
| p50 | 0.03ms | 0.02ms | +0.0027ms | +12.05% |
| p95 | 0.03ms | 0.03ms | +0.0054ms | +20.89% |
| p99 | 0.03ms | 0.03ms | +0.0026ms | +8.91% |
| mean | 0.03ms | 0.02ms | +0.0030ms | +12.71% |
| min | 0.02ms | 0.02ms | +0.0019ms | +8.62% |
| max | 0.03ms | 0.03ms | +0.0019ms | +6.35% |
| total | 0.53ms | 0.47ms | +0.06ms | +12.71% |

