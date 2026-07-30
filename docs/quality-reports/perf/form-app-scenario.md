# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.06ms | 0.10ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0024ms | 0.0031ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | cpu | 0.08ms | 0.09ms | 0.06ms | 0.789 | 0.790 | 0.07ms | 0.07ms |
| multi_field_validate_batch (5 provider-mixed validate) | cpu | 0.08ms | 0.09ms | 0.0024ms | 0.030 | 0.029 | 0.0025ms | 0.0024ms |
| submit_error_handling (5 required-missing → onError catch) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.272 | 0.285 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.37ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | -79768 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 648 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 6688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.14ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.14ms |
| total | 1.55ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.021)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.07ms | -0.000064ms | -0.10% |
| p50 | 0.07ms | 0.08ms | -0.0042ms | -5.54% |
| p95 | 0.11ms | 0.10ms | +0.0017ms | +1.67% |
| p99 | 0.14ms | 0.14ms | -0.0039ms | -2.73% |
| mean | 0.08ms | 0.08ms | -0.00040ms | -0.50% |
| min | 0.06ms | 0.07ms | -0.0042ms | -6.32% |
| max | 0.15ms | 0.15ms | -0.0053ms | -3.48% |
| total | 1.59ms | 1.59ms | -0.0079ms | -0.50% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0031ms |
| p99 | 0.0038ms |
| mean | 0.0026ms |
| stdev | 0.00036ms |
| min | 0.0024ms |
| max | 0.0040ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.020)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0024ms | +0.000052ms | +2.15% |
| p50 | 0.0025ms | 0.0025ms | +0.0000079ms | +0.32% |
| p95 | 0.0031ms | 0.0031ms | +0.000081ms | +2.64% |
| p99 | 0.0039ms | 0.0041ms | -0.00025ms | -6.17% |
| mean | 0.0026ms | 0.0026ms | +0.000025ms | +0.94% |
| min | 0.0024ms | 0.0024ms | +0.000048ms | +2.01% |
| max | 0.0040ms | 0.0044ms | -0.00034ms | -7.71% |
| total | 0.05ms | 0.05ms | +0.00049ms | +0.94% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0010ms | -4.46% |
| p50 | 0.02ms | 0.02ms | -0.00097ms | -4.14% |
| p95 | 0.03ms | 0.03ms | +0.00069ms | +2.24% |
| p99 | 0.03ms | 0.04ms | -0.0059ms | -14.52% |
| mean | 0.02ms | 0.03ms | -0.00080ms | -3.17% |
| min | 0.02ms | 0.02ms | -0.0012ms | -5.28% |
| max | 0.04ms | 0.04ms | -0.0075ms | -17.53% |
| total | 0.49ms | 0.50ms | -0.02ms | -3.17% |

