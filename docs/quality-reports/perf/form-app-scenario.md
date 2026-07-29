# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.06ms | 0.11ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0024ms | 0.0027ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.33ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | -85336 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 248 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 6656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.11ms |
| p99 | 0.14ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.14ms |
| total | 1.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | +0.00052ms | +0.82% |
| p50 | 0.07ms | 0.07ms | -0.00021ms | -0.28% |
| p95 | 0.11ms | 0.11ms | -0.00081ms | -0.73% |
| p99 | 0.14ms | 0.12ms | +0.02ms | +17.13% |
| mean | 0.08ms | 0.08ms | -0.00025ms | -0.32% |
| min | 0.06ms | 0.06ms | +0.00075ms | +1.21% |
| max | 0.14ms | 0.12ms | +0.02ms | +21.39% |
| total | 1.56ms | 1.57ms | -0.0050ms | -0.32% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0024ms |
| p95 | 0.0027ms |
| p99 | 0.0030ms |
| mean | 0.0025ms |
| stdev | 0.00017ms |
| min | 0.0024ms |
| max | 0.0031ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| p50 | 0.0024ms | 0.0025ms | -0.000083ms | -3.32% |
| p95 | 0.0027ms | 0.0029ms | -0.00023ms | -8.02% |
| p99 | 0.0030ms | 0.0031ms | -0.000013ms | -0.44% |
| mean | 0.0025ms | 0.0025ms | -0.000077ms | -3.02% |
| min | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| max | 0.0031ms | 0.0031ms | +0.000042ms | +1.36% |
| total | 0.05ms | 0.05ms | -0.0015ms | -3.02% |

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
| mean | 0.03ms |
| stdev | 0.0039ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0013ms | -5.55% |
| p50 | 0.02ms | 0.02ms | -0.00087ms | -3.68% |
| p95 | 0.03ms | 0.04ms | -0.0056ms | -15.42% |
| p99 | 0.03ms | 0.04ms | -0.0038ms | -9.88% |
| mean | 0.03ms | 0.03ms | -0.00073ms | -2.85% |
| min | 0.02ms | 0.02ms | -0.0013ms | -5.46% |
| max | 0.04ms | 0.04ms | -0.0034ms | -8.61% |
| total | 0.50ms | 0.52ms | -0.01ms | -2.85% |

