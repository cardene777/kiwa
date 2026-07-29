# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.13ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.15ms | 80ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +137% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.05ms | 80ms | 0.00042ms | PASS | stable (p10 -3% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.17ms | 80ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +100% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 1.01ms | 100ms | PASS |
| validateAllForms | 0.60ms | 160ms | PASS |
| submitAllForms | 0.50ms | 160ms | PASS |
| a11yAllForms | 1.31ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 496 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -57984 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -29432 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -5688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.13ms |
| p99 | 0.20ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.05ms |
| max | 0.24ms |
| total | 3.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.0097ms | -15.67% |
| p50 | 0.07ms | 0.07ms | -0.0039ms | -5.52% |
| p95 | 0.13ms | 0.14ms | -0.02ms | -11.60% |
| p99 | 0.20ms | 0.30ms | -0.10ms | -34.28% |
| mean | 0.08ms | 0.09ms | -0.0075ms | -8.66% |
| min | 0.05ms | 0.05ms | -0.0052ms | -10.18% |
| max | 0.24ms | 0.39ms | -0.16ms | -39.65% |
| total | 3.17ms | 3.47ms | -0.30ms | -8.66% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.15ms |
| p99 | 0.40ms |
| mean | 0.07ms |
| stdev | 0.08ms |
| min | 0.04ms |
| max | 0.47ms |
| total | 2.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00050ms | +1.26% |
| p50 | 0.04ms | 0.04ms | -0.00021ms | -0.51% |
| p95 | 0.15ms | 0.06ms | +0.09ms | +137.14% |
| p99 | 0.40ms | 0.13ms | +0.28ms | +218.10% |
| mean | 0.07ms | 0.05ms | +0.02ms | +35.90% |
| min | 0.04ms | 0.04ms | +0.00058ms | +1.49% |
| max | 0.47ms | 0.16ms | +0.31ms | +193.67% |
| total | 2.64ms | 1.94ms | +0.70ms | +35.90% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.12ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.17ms |
| total | 1.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00096ms | -2.96% |
| p50 | 0.04ms | 0.03ms | +0.0041ms | +12.32% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +37.81% |
| p99 | 0.12ms | 0.04ms | +0.08ms | +207.56% |
| mean | 0.04ms | 0.03ms | +0.0073ms | +21.46% |
| min | 0.03ms | 0.03ms | -0.00071ms | -2.26% |
| max | 0.17ms | 0.04ms | +0.13ms | +312.15% |
| total | 1.66ms | 1.36ms | +0.29ms | +21.46% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.17ms |
| p99 | 0.25ms |
| mean | 0.09ms |
| stdev | 0.04ms |
| min | 0.06ms |
| max | 0.29ms |
| total | 3.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | +0.00097ms | +1.62% |
| p50 | 0.07ms | 0.08ms | -0.0026ms | -3.35% |
| p95 | 0.17ms | 0.09ms | +0.09ms | +99.73% |
| p99 | 0.25ms | 0.15ms | +0.10ms | +66.37% |
| mean | 0.09ms | 0.08ms | +0.0098ms | +12.89% |
| min | 0.06ms | 0.06ms | +0.0012ms | +2.03% |
| max | 0.29ms | 0.18ms | +0.10ms | +54.52% |
| total | 3.42ms | 3.03ms | +0.39ms | +12.89% |

