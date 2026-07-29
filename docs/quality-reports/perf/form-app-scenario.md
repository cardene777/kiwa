# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.07ms | 0.12ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0060ms | 0.0078ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.35ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 30792 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 616 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 72 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.07ms |
| p50 | 0.08ms |
| p95 | 0.12ms |
| p99 | 0.17ms |
| mean | 0.09ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.19ms |
| total | 1.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.06ms | +0.0035ms | +5.56% |
| p50 | 0.08ms | 0.07ms | +0.0052ms | +7.00% |
| p95 | 0.12ms | 0.11ms | +0.0071ms | +6.38% |
| p99 | 0.17ms | 0.12ms | +0.06ms | +49.05% |
| mean | 0.09ms | 0.08ms | +0.0090ms | +11.54% |
| min | 0.06ms | 0.06ms | +0.0025ms | +4.09% |
| max | 0.19ms | 0.12ms | +0.07ms | +59.23% |
| total | 1.75ms | 1.57ms | +0.18ms | +11.54% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0061ms |
| p95 | 0.0078ms |
| p99 | 0.0083ms |
| mean | 0.0064ms |
| stdev | 0.00068ms |
| min | 0.0060ms |
| max | 0.0084ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0025ms | +0.0035ms | +143.93% |
| p50 | 0.0061ms | 0.0025ms | +0.0036ms | +145.82% |
| p95 | 0.0078ms | 0.0029ms | +0.0049ms | +167.42% |
| p99 | 0.0083ms | 0.0031ms | +0.0052ms | +170.84% |
| mean | 0.0064ms | 0.0025ms | +0.0039ms | +152.10% |
| min | 0.0060ms | 0.0025ms | +0.0035ms | +142.39% |
| max | 0.0084ms | 0.0031ms | +0.0053ms | +171.65% |
| total | 0.13ms | 0.05ms | +0.08ms | +152.10% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0042ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00054ms | +2.33% |
| p50 | 0.02ms | 0.02ms | +0.00088ms | +3.68% |
| p95 | 0.04ms | 0.04ms | -0.00036ms | -0.99% |
| p99 | 0.04ms | 0.04ms | -0.0026ms | -6.75% |
| mean | 0.03ms | 0.03ms | +0.0012ms | +4.51% |
| min | 0.02ms | 0.02ms | +0.00046ms | +2.01% |
| max | 0.04ms | 0.04ms | -0.0032ms | -8.08% |
| total | 0.54ms | 0.52ms | +0.02ms | +4.51% |

