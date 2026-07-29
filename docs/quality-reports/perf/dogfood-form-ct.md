# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.15ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.08ms | 80ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.04ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.08ms | 0.28ms | 80ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.58ms | 100ms | PASS |
| validateAllForms | 0.82ms | 160ms | PASS |
| submitAllForms | 0.69ms | 160ms | PASS |
| a11yAllForms | 1.19ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | -5544 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -2080 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -30688 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | 3968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.15ms |
| p99 | 0.29ms |
| mean | 0.09ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.37ms |
| total | 3.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.0072ms | -11.63% |
| p50 | 0.07ms | 0.07ms | +0.00063ms | +0.89% |
| p95 | 0.15ms | 0.14ms | +0.0086ms | +6.00% |
| p99 | 0.29ms | 0.30ms | -0.01ms | -3.63% |
| mean | 0.09ms | 0.09ms | +0.0026ms | +2.97% |
| min | 0.05ms | 0.05ms | -0.0023ms | -4.60% |
| max | 0.37ms | 0.39ms | -0.02ms | -6.12% |
| total | 3.57ms | 3.47ms | +0.10ms | +2.97% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.26ms |
| mean | 0.05ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.33ms |
| total | 2.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0020ms | -5.06% |
| p50 | 0.04ms | 0.04ms | -0.0027ms | -6.48% |
| p95 | 0.08ms | 0.06ms | +0.02ms | +25.64% |
| p99 | 0.26ms | 0.13ms | +0.13ms | +103.46% |
| mean | 0.05ms | 0.05ms | +0.0059ms | +12.10% |
| min | 0.04ms | 0.04ms | -0.0016ms | -4.14% |
| max | 0.33ms | 0.16ms | +0.17ms | +105.51% |
| total | 2.18ms | 1.94ms | +0.23ms | +12.10% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.12ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0045ms | -13.99% |
| p50 | 0.03ms | 0.03ms | -0.0051ms | -15.31% |
| p95 | 0.04ms | 0.04ms | -0.0023ms | -6.24% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +128.49% |
| mean | 0.03ms | 0.03ms | -0.0025ms | -7.38% |
| min | 0.03ms | 0.03ms | -0.0036ms | -11.55% |
| max | 0.12ms | 0.04ms | +0.08ms | +208.10% |
| total | 1.26ms | 1.36ms | -0.10ms | -7.38% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.08ms |
| p50 | 0.11ms |
| p95 | 0.28ms |
| p99 | 0.43ms |
| mean | 0.14ms |
| stdev | 0.09ms |
| min | 0.07ms |
| max | 0.53ms |
| total | 5.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.06ms | +0.02ms | +25.65% |
| p50 | 0.11ms | 0.08ms | +0.03ms | +39.68% |
| p95 | 0.28ms | 0.09ms | +0.19ms | +217.51% |
| p99 | 0.43ms | 0.15ms | +0.29ms | +192.89% |
| mean | 0.14ms | 0.08ms | +0.06ms | +79.49% |
| min | 0.07ms | 0.06ms | +0.01ms | +23.83% |
| max | 0.53ms | 0.18ms | +0.34ms | +184.22% |
| total | 5.44ms | 3.03ms | +2.41ms | +79.49% |

