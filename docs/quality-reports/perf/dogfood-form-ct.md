# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.06ms | 0.13ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.06ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.13ms | 80ms | 0.00033ms | PASS | stable (p10 -6% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.53ms | 100ms | PASS |
| validateAllForms | 0.57ms | 160ms | PASS |
| submitAllForms | 0.47ms | 160ms | PASS |
| a11yAllForms | 0.71ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 1024 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -57440 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -24192 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -3312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.13ms |
| p99 | 0.21ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.05ms |
| max | 0.26ms |
| total | 3.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0044ms | -7.11% |
| p50 | 0.07ms | 0.07ms | -0.0035ms | -4.95% |
| p95 | 0.13ms | 0.14ms | -0.02ms | -11.69% |
| p99 | 0.21ms | 0.30ms | -0.09ms | -30.21% |
| mean | 0.08ms | 0.09ms | -0.0085ms | -9.84% |
| min | 0.05ms | 0.05ms | -0.0052ms | -10.18% |
| max | 0.26ms | 0.39ms | -0.13ms | -34.21% |
| total | 3.13ms | 3.47ms | -0.34ms | -9.84% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.11ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.14ms |
| total | 1.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0040ms | -10.19% |
| p50 | 0.04ms | 0.04ms | -0.0048ms | -11.65% |
| p95 | 0.06ms | 0.06ms | -0.0044ms | -7.01% |
| p99 | 0.11ms | 0.13ms | -0.02ms | -15.16% |
| mean | 0.04ms | 0.05ms | -0.0054ms | -11.18% |
| min | 0.04ms | 0.04ms | -0.0038ms | -9.67% |
| max | 0.14ms | 0.16ms | -0.03ms | -16.02% |
| total | 1.72ms | 1.94ms | -0.22ms | -11.18% |

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
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.11ms |
| total | 1.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00090ms | -2.76% |
| p50 | 0.03ms | 0.03ms | -0.0014ms | -4.17% |
| p95 | 0.04ms | 0.04ms | +0.0051ms | +13.60% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +116.19% |
| mean | 0.04ms | 0.03ms | +0.00099ms | +2.90% |
| min | 0.03ms | 0.03ms | -0.00046ms | -1.46% |
| max | 0.11ms | 0.04ms | +0.07ms | +179.54% |
| total | 1.40ms | 1.36ms | +0.04ms | +2.90% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.08ms |
| p95 | 0.13ms |
| p99 | 0.21ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.23ms |
| total | 3.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0037ms | -6.06% |
| p50 | 0.08ms | 0.08ms | +0.0025ms | +3.33% |
| p95 | 0.13ms | 0.09ms | +0.04ms | +44.87% |
| p99 | 0.21ms | 0.15ms | +0.06ms | +41.69% |
| mean | 0.08ms | 0.08ms | +0.0080ms | +10.52% |
| min | 0.06ms | 0.06ms | -0.0038ms | -6.43% |
| max | 0.23ms | 0.18ms | +0.05ms | +25.94% |
| total | 3.35ms | 3.03ms | +0.32ms | +10.52% |

