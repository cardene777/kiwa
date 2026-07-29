# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.07ms | 0.15ms | 100ms | 0.00049ms | PASS | stable (p10 +4% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.0026ms | 0.0048ms | 100ms | 0.00049ms | PASS | stable (p10 +5% (閾値未満)、 p95 +63% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.44ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 22448 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | -344 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.15ms |
| p99 | 0.16ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.16ms |
| total | 1.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.06ms | +0.0024ms | +3.74% |
| p50 | 0.08ms | 0.07ms | +0.00083ms | +1.12% |
| p95 | 0.15ms | 0.11ms | +0.04ms | +32.95% |
| p99 | 0.16ms | 0.12ms | +0.04ms | +35.77% |
| mean | 0.08ms | 0.08ms | +0.0055ms | +7.06% |
| min | 0.06ms | 0.06ms | +0.00021ms | +0.34% |
| max | 0.16ms | 0.12ms | +0.04ms | +36.45% |
| total | 1.68ms | 1.57ms | +0.11ms | +7.06% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0048ms |
| p99 | 0.0048ms |
| mean | 0.0033ms |
| stdev | 0.00085ms |
| min | 0.0025ms |
| max | 0.0048ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0025ms | +0.00012ms | +4.92% |
| p50 | 0.0027ms | 0.0025ms | +0.00021ms | +8.34% |
| p95 | 0.0048ms | 0.0029ms | +0.0018ms | +62.50% |
| p99 | 0.0048ms | 0.0031ms | +0.0017ms | +56.79% |
| mean | 0.0033ms | 0.0025ms | +0.00070ms | +27.56% |
| min | 0.0025ms | 0.0025ms | +0.000042ms | +1.71% |
| max | 0.0048ms | 0.0031ms | +0.0017ms | +55.43% |
| total | 0.07ms | 0.05ms | +0.01ms | +27.56% |

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
| stdev | 0.0049ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00074ms | -3.22% |
| p50 | 0.02ms | 0.02ms | -0.00033ms | -1.40% |
| p95 | 0.03ms | 0.04ms | -0.0041ms | -11.26% |
| p99 | 0.04ms | 0.04ms | +0.00082ms | +2.13% |
| mean | 0.03ms | 0.03ms | +0.00014ms | +0.54% |
| min | 0.02ms | 0.02ms | -0.00063ms | -2.73% |
| max | 0.04ms | 0.04ms | +0.0020ms | +5.21% |
| total | 0.52ms | 0.52ms | +0.0028ms | +0.54% |

