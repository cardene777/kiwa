# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.07ms | 0.11ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0024ms | 0.0039ms | 100ms | 0.00050ms | PASS | stable (p10 -2% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.36ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 21112 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | -296 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.11ms |
| p99 | 0.19ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.21ms |
| total | 1.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.06ms | +0.0026ms | +4.17% |
| p50 | 0.07ms | 0.07ms | -0.00033ms | -0.45% |
| p95 | 0.11ms | 0.11ms | -0.0017ms | -1.54% |
| p99 | 0.19ms | 0.12ms | +0.08ms | +67.04% |
| mean | 0.08ms | 0.08ms | +0.0045ms | +5.76% |
| min | 0.06ms | 0.06ms | +0.0023ms | +3.76% |
| max | 0.21ms | 0.12ms | +0.10ms | +83.41% |
| total | 1.66ms | 1.57ms | +0.09ms | +5.76% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0027ms |
| p95 | 0.0039ms |
| p99 | 0.0046ms |
| mean | 0.0030ms |
| stdev | 0.00065ms |
| min | 0.0024ms |
| max | 0.0048ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.000042ms | -1.71% |
| p50 | 0.0027ms | 0.0025ms | +0.00017ms | +6.66% |
| p95 | 0.0039ms | 0.0029ms | +0.0010ms | +34.08% |
| p99 | 0.0046ms | 0.0031ms | +0.0016ms | +51.34% |
| mean | 0.0030ms | 0.0025ms | +0.00041ms | +16.27% |
| min | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| max | 0.0048ms | 0.0031ms | +0.0017ms | +55.43% |
| total | 0.06ms | 0.05ms | +0.0083ms | +16.27% |

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
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00058ms | -2.53% |
| p50 | 0.02ms | 0.02ms | -0.00069ms | -2.89% |
| p95 | 0.03ms | 0.04ms | -0.0046ms | -12.80% |
| p99 | 0.03ms | 0.04ms | -0.0044ms | -11.29% |
| mean | 0.02ms | 0.03ms | -0.00089ms | -3.44% |
| min | 0.02ms | 0.02ms | -0.00092ms | -4.01% |
| max | 0.03ms | 0.04ms | -0.0043ms | -10.94% |
| total | 0.50ms | 0.52ms | -0.02ms | -3.44% |

