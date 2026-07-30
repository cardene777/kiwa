# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0080ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0022ms | 0.0041ms | 100ms | 0.00046ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.02ms | 0.06ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | cpu | 0.08ms | 0.09ms | 0.0080ms | 0.097 | 0.092 | 0.0080ms | 0.0076ms |
| multi_platform_batch (5 iOS+Android+web env switch) | cpu | 0.09ms | 0.09ms | 0.0022ms | 0.024 | 0.024 | 0.0020ms | 0.0020ms |
| linking_error_handling (5 invalid url + listener cleanup) | cpu | 0.08ms | 0.11ms | 0.02ms | 0.185 | 0.173 | 0.02ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.05ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.02ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 11392 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 744 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 248 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0080ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0020ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0076ms | +0.00038ms | +5.04% |
| p50 | 0.0087ms | 0.0090ms | -0.00031ms | -3.43% |
| p95 | 0.01ms | 0.01ms | -0.0011ms | -7.24% |
| p99 | 0.02ms | 0.01ms | +0.00030ms | +2.03% |
| mean | 0.0093ms | 0.0093ms | -0.000066ms | -0.71% |
| min | 0.0078ms | 0.0074ms | +0.00035ms | +4.67% |
| max | 0.02ms | 0.01ms | +0.00065ms | +4.33% |
| total | 0.19ms | 0.19ms | -0.0013ms | -0.71% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0033ms |
| p95 | 0.0041ms |
| p99 | 0.0041ms |
| mean | 0.0031ms |
| stdev | 0.00073ms |
| min | 0.0021ms |
| max | 0.0041ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +0.000021ms | +1.06% |
| p50 | 0.0030ms | 0.0021ms | +0.00093ms | +44.83% |
| p95 | 0.0037ms | 0.0031ms | +0.00066ms | +21.47% |
| p99 | 0.0037ms | 0.0037ms | +0.000060ms | +1.64% |
| mean | 0.0028ms | 0.0023ms | +0.00056ms | +24.66% |
| min | 0.0019ms | 0.0020ms | -0.0000099ms | -0.51% |
| max | 0.0037ms | 0.0038ms | -0.000090ms | -2.35% |
| total | 0.06ms | 0.05ms | +0.01ms | +24.66% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.00097ms | +6.80% |
| p50 | 0.02ms | 0.01ms | +0.0015ms | +10.16% |
| p95 | 0.06ms | 0.08ms | -0.03ms | -32.48% |
| p99 | 0.07ms | 0.12ms | -0.05ms | -38.87% |
| mean | 0.02ms | 0.02ms | -0.00059ms | -2.48% |
| min | 0.01ms | 0.01ms | +0.00050ms | +3.49% |
| max | 0.08ms | 0.13ms | -0.05ms | -39.93% |
| total | 0.47ms | 0.48ms | -0.01ms | -2.48% |

