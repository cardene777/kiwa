# Perf Suite — graphql-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.03ms | 0.04ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 createUser mutations) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscription_error_handling (5 subscribe + close + invalid) | 0.02ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | cpu | 0.08ms | 0.03ms | 0.300 | 0.315 | 0.02ms | 0.03ms |
| mutation_batch (5 createUser mutations) | cpu | 0.08ms | 0.01ms | 0.143 | 0.147 | 0.01ms | 0.01ms |
| subscription_error_handling (5 subscribe + close + invalid) | cpu | 0.08ms | 0.02ms | 0.255 | 0.264 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| query_workflow (10 client.query with variables) | 0.17ms | 200ms | PASS |
| mutation_batch (5 createUser mutations) | 0.07ms | 200ms | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| query_workflow (10 client.query with variables) | 55272 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 createUser mutations) | 38288 B | 0 B | 102400 B | yes | PASS |
| subscription_error_handling (5 subscribe + close + invalid) | -1032 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0049ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00059ms | -2.27% |
| p50 | 0.03ms | 0.03ms | -0.0022ms | -7.14% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -40.75% |
| p99 | 0.04ms | 0.17ms | -0.13ms | -77.01% |
| mean | 0.03ms | 0.04ms | -0.01ms | -26.95% |
| min | 0.02ms | 0.02ms | +0.00013ms | +0.55% |
| max | 0.04ms | 0.20ms | -0.16ms | -80.03% |
| total | 0.59ms | 0.81ms | -0.22ms | -26.95% |

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
| stdev | 0.0032ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00054ms | -4.51% |
| p50 | 0.01ms | 0.01ms | +0.00027ms | +2.11% |
| p95 | 0.02ms | 0.02ms | -0.0016ms | -7.54% |
| p99 | 0.02ms | 0.08ms | -0.06ms | -72.56% |
| mean | 0.01ms | 0.02ms | -0.0032ms | -18.62% |
| min | 0.01ms | 0.01ms | -0.00058ms | -4.98% |
| max | 0.02ms | 0.09ms | -0.07ms | -76.09% |
| total | 0.28ms | 0.35ms | -0.06ms | -18.62% |

### subscription_error_handling (5 subscribe + close + invalid)

# Perf Report — subscription_error_handling (5 subscribe + close + invalid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.09ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0015ms | -6.63% |
| p50 | 0.02ms | 0.03ms | -0.0029ms | -11.45% |
| p95 | 0.03ms | 0.13ms | -0.10ms | -77.20% |
| p99 | 0.08ms | 0.13ms | -0.05ms | -39.00% |
| mean | 0.03ms | 0.04ms | -0.02ms | -41.19% |
| min | 0.02ms | 0.02ms | -0.0011ms | -5.32% |
| max | 0.09ms | 0.13ms | -0.04ms | -29.57% |
| total | 0.52ms | 0.89ms | -0.37ms | -41.19% |

