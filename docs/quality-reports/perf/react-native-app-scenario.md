# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0074ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0019ms | 0.0025ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | cpu | 0.08ms | 0.0074ms | 0.089 | 0.093 | 0.0073ms | 0.0076ms |
| multi_platform_batch (5 iOS+Android+web env switch) | cpu | 0.08ms | 0.0019ms | 0.023 | 0.023 | 0.0019ms | 0.0019ms |
| linking_error_handling (5 invalid url + listener cleanup) | cpu | 0.08ms | 0.01ms | 0.175 | 0.177 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.04ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 24576 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 744 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0089ms |
| stdev | 0.0020ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0076ms | -0.00021ms | -2.76% |
| p50 | 0.0086ms | 0.0088ms | -0.00013ms | -1.43% |
| p95 | 0.01ms | 0.01ms | +0.0012ms | +11.13% |
| p99 | 0.02ms | 0.02ms | -0.0010ms | -6.13% |
| mean | 0.0089ms | 0.0091ms | -0.00021ms | -2.37% |
| min | 0.0073ms | 0.0075ms | -0.00025ms | -3.30% |
| max | 0.02ms | 0.02ms | -0.0015ms | -8.75% |
| total | 0.18ms | 0.18ms | -0.0043ms | -2.37% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0025ms |
| p99 | 0.0026ms |
| mean | 0.0021ms |
| stdev | 0.00022ms |
| min | 0.0019ms |
| max | 0.0026ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0019ms | +9.0e-7ms | +0.05% |
| p50 | 0.0020ms | 0.0020ms | 0.00ms | 0.00% |
| p95 | 0.0025ms | 0.0028ms | -0.00028ms | -9.82% |
| p99 | 0.0026ms | 0.0033ms | -0.00069ms | -21.11% |
| mean | 0.0021ms | 0.0021ms | -0.000038ms | -1.78% |
| min | 0.0019ms | 0.0019ms | 0.00ms | 0.00% |
| max | 0.0026ms | 0.0034ms | -0.00079ms | -23.47% |
| total | 0.04ms | 0.04ms | -0.00075ms | -1.78% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00040ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000083ms | -0.57% |
| p50 | 0.01ms | 0.02ms | -0.00052ms | -3.44% |
| p95 | 0.02ms | 0.05ms | -0.04ms | -70.81% |
| p99 | 0.02ms | 0.08ms | -0.07ms | -81.01% |
| mean | 0.01ms | 0.02ms | -0.0079ms | -34.95% |
| min | 0.01ms | 0.01ms | -0.00013ms | -0.87% |
| max | 0.02ms | 0.09ms | -0.07ms | -82.53% |
| total | 0.30ms | 0.45ms | -0.16ms | -34.95% |

