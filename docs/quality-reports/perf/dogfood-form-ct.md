# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.14ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.08ms | 80ms | 0.00042ms | PASS | stable (p10 -4% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.14ms | 80ms | 0.00042ms | PASS | stable (p10 -12% (閾値未満)、 p95 +267% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.14ms | 80ms | 0.00042ms | PASS | stable (p10 -4% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 1.05ms | 100ms | PASS |
| validateAllForms | 0.53ms | 160ms | PASS |
| submitAllForms | 0.48ms | 160ms | PASS |
| a11yAllForms | 0.74ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 432 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -68520 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | 1816 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -27344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.14ms |
| p99 | 0.24ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.05ms |
| max | 0.31ms |
| total | 3.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.0073ms | -11.73% |
| p50 | 0.07ms | 0.07ms | -0.00060ms | -0.87% |
| p95 | 0.14ms | 0.14ms | -0.0026ms | -1.78% |
| p99 | 0.24ms | 0.30ms | -0.06ms | -18.39% |
| mean | 0.08ms | 0.09ms | -0.0031ms | -3.54% |
| min | 0.05ms | 0.05ms | -0.0024ms | -4.76% |
| max | 0.31ms | 0.39ms | -0.08ms | -20.79% |
| total | 3.35ms | 3.47ms | -0.12ms | -3.54% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.25ms |
| mean | 0.06ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.29ms |
| total | 2.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0018ms | -4.44% |
| p50 | 0.04ms | 0.04ms | -0.00027ms | -0.66% |
| p95 | 0.08ms | 0.06ms | +0.01ms | +21.09% |
| p99 | 0.25ms | 0.13ms | +0.12ms | +96.47% |
| mean | 0.06ms | 0.05ms | +0.0070ms | +14.35% |
| min | 0.04ms | 0.04ms | -0.0021ms | -5.31% |
| max | 0.29ms | 0.16ms | +0.13ms | +79.19% |
| total | 2.22ms | 1.94ms | +0.28ms | +14.35% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.14ms |
| p99 | 0.15ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.15ms |
| total | 2.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0040ms | -12.45% |
| p50 | 0.04ms | 0.03ms | +0.0019ms | +5.54% |
| p95 | 0.14ms | 0.04ms | +0.10ms | +267.24% |
| p99 | 0.15ms | 0.04ms | +0.11ms | +281.03% |
| mean | 0.05ms | 0.03ms | +0.02ms | +55.48% |
| min | 0.03ms | 0.03ms | -0.0037ms | -11.95% |
| max | 0.15ms | 0.04ms | +0.11ms | +286.29% |
| total | 2.12ms | 1.36ms | +0.76ms | +55.48% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.14ms |
| p99 | 0.22ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.06ms |
| max | 0.22ms |
| total | 3.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0024ms | -3.93% |
| p50 | 0.07ms | 0.08ms | -0.0024ms | -3.19% |
| p95 | 0.14ms | 0.09ms | +0.06ms | +66.31% |
| p99 | 0.22ms | 0.15ms | +0.07ms | +48.15% |
| mean | 0.08ms | 0.08ms | +0.0053ms | +7.04% |
| min | 0.06ms | 0.06ms | -0.0022ms | -3.77% |
| max | 0.22ms | 0.18ms | +0.04ms | +20.42% |
| total | 3.25ms | 3.03ms | +0.21ms | +7.04% |

