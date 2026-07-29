# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.06ms | 0.09ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0025ms | 0.0051ms | 100ms | 0.00049ms | PASS | stable (p10 0% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.33ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 23176 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 616 B | 0 B | 102400 B | yes | PASS |
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
| stdev | 0.0093ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.000016ms | -0.03% |
| p50 | 0.07ms | 0.07ms | -0.0031ms | -4.12% |
| p95 | 0.09ms | 0.11ms | -0.02ms | -20.60% |
| p99 | 0.09ms | 0.12ms | -0.03ms | -22.94% |
| mean | 0.07ms | 0.08ms | -0.0050ms | -6.40% |
| min | 0.06ms | 0.06ms | +0.0012ms | +1.88% |
| max | 0.09ms | 0.12ms | -0.03ms | -23.50% |
| total | 1.47ms | 1.57ms | -0.10ms | -6.40% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.0051ms |
| p99 | 0.0098ms |
| mean | 0.0034ms |
| stdev | 0.0019ms |
| min | 0.0024ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | 0.00ms | 0.00% |
| p50 | 0.0026ms | 0.0025ms | +0.00015ms | +5.82% |
| p95 | 0.0051ms | 0.0029ms | +0.0022ms | +74.34% |
| p99 | 0.0098ms | 0.0031ms | +0.0067ms | +219.65% |
| mean | 0.0034ms | 0.0025ms | +0.00084ms | +32.87% |
| min | 0.0024ms | 0.0025ms | -0.000041ms | -1.67% |
| max | 0.01ms | 0.0031ms | +0.0078ms | +254.10% |
| total | 0.07ms | 0.05ms | +0.02ms | +32.87% |

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
| stdev | 0.0042ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00050ms | -2.17% |
| p50 | 0.02ms | 0.02ms | -0.00037ms | -1.58% |
| p95 | 0.03ms | 0.04ms | -0.0036ms | -10.06% |
| p99 | 0.04ms | 0.04ms | -0.0010ms | -2.66% |
| mean | 0.03ms | 0.03ms | -0.00037ms | -1.43% |
| min | 0.02ms | 0.02ms | -0.00063ms | -2.73% |
| max | 0.04ms | 0.04ms | -0.00038ms | -0.96% |
| total | 0.51ms | 0.52ms | -0.0074ms | -1.43% |

