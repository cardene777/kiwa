# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.06ms | 0.09ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0023ms | 0.0027ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.34ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 21744 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 12568 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.09ms |
| p99 | 0.09ms |
| mean | 0.07ms |
| stdev | 0.0078ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | +0.00087ms | +1.37% |
| p50 | 0.07ms | 0.07ms | -0.0049ms | -6.64% |
| p95 | 0.09ms | 0.11ms | -0.02ms | -22.09% |
| p99 | 0.09ms | 0.12ms | -0.03ms | -22.65% |
| mean | 0.07ms | 0.08ms | -0.0062ms | -7.97% |
| min | 0.06ms | 0.06ms | +0.00079ms | +1.28% |
| max | 0.09ms | 0.12ms | -0.03ms | -22.78% |
| total | 1.44ms | 1.57ms | -0.12ms | -7.97% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0027ms |
| p99 | 0.0032ms |
| mean | 0.0025ms |
| stdev | 0.00022ms |
| min | 0.0023ms |
| max | 0.0033ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0025ms | -0.00012ms | -5.04% |
| p50 | 0.0024ms | 0.0025ms | -0.000083ms | -3.32% |
| p95 | 0.0027ms | 0.0029ms | -0.00019ms | -6.37% |
| p99 | 0.0032ms | 0.0031ms | +0.00013ms | +4.26% |
| mean | 0.0025ms | 0.0025ms | -0.000083ms | -3.26% |
| min | 0.0023ms | 0.0025ms | -0.00013ms | -5.09% |
| max | 0.0033ms | 0.0031ms | +0.00021ms | +6.78% |
| total | 0.05ms | 0.05ms | -0.0017ms | -3.26% |

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
| mean | 0.02ms |
| stdev | 0.0045ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0015ms | -6.31% |
| p50 | 0.02ms | 0.02ms | -0.0016ms | -6.66% |
| p95 | 0.03ms | 0.04ms | -0.0020ms | -5.61% |
| p99 | 0.04ms | 0.04ms | -0.0023ms | -6.06% |
| mean | 0.02ms | 0.03ms | -0.0013ms | -4.90% |
| min | 0.02ms | 0.02ms | -0.0015ms | -6.56% |
| max | 0.04ms | 0.04ms | -0.0024ms | -6.16% |
| total | 0.49ms | 0.52ms | -0.03ms | -4.90% |

