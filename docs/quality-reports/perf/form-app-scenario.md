# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.07ms | 0.09ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0024ms | 0.0049ms | 100ms | 0.00042ms | PASS | stable (p10 -2% (閾値未満)、 p95 +67% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.34ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 8424 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 616 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 7088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.09ms |
| mean | 0.07ms |
| stdev | 0.0078ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.06ms | +0.0023ms | +3.59% |
| p50 | 0.07ms | 0.07ms | -0.0036ms | -4.82% |
| p95 | 0.09ms | 0.11ms | -0.02ms | -20.44% |
| p99 | 0.09ms | 0.12ms | -0.03ms | -22.68% |
| mean | 0.07ms | 0.08ms | -0.0045ms | -5.81% |
| min | 0.06ms | 0.06ms | +0.0000010ms | +0.00% |
| max | 0.09ms | 0.12ms | -0.03ms | -23.21% |
| total | 1.47ms | 1.57ms | -0.09ms | -5.81% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0049ms |
| p99 | 0.0092ms |
| mean | 0.0033ms |
| stdev | 0.0018ms |
| min | 0.0024ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.000045ms | -1.84% |
| p50 | 0.0025ms | 0.0025ms | +0.000021ms | +0.84% |
| p95 | 0.0049ms | 0.0029ms | +0.0019ms | +66.51% |
| p99 | 0.0092ms | 0.0031ms | +0.0062ms | +201.76% |
| mean | 0.0033ms | 0.0025ms | +0.00073ms | +28.55% |
| min | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| max | 0.01ms | 0.0031ms | +0.0072ms | +233.83% |
| total | 0.07ms | 0.05ms | +0.01ms | +28.55% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0044ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00026ms | -1.14% |
| p50 | 0.02ms | 0.02ms | +0.00038ms | +1.58% |
| p95 | 0.03ms | 0.04ms | -0.0018ms | -4.98% |
| p99 | 0.04ms | 0.04ms | -0.0012ms | -3.09% |
| mean | 0.03ms | 0.03ms | +0.00012ms | +0.46% |
| min | 0.02ms | 0.02ms | -0.00054ms | -2.37% |
| max | 0.04ms | 0.04ms | -0.0010ms | -2.66% |
| total | 0.52ms | 0.52ms | +0.0024ms | +0.46% |

