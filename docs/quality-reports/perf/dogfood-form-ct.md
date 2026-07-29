# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.15ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.06ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.04ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.07ms | 0.17ms | 80ms | 0.00042ms | PASS | stable (p10 +9% (閾値未満)、 p95 +95% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 1.27ms | 100ms | PASS |
| validateAllForms | 0.57ms | 160ms | PASS |
| submitAllForms | 0.38ms | 160ms | PASS |
| a11yAllForms | 0.71ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | -48 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -59376 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -24112 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -3464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.15ms |
| p99 | 0.20ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.22ms |
| total | 3.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.01ms | -24.16% |
| p50 | 0.06ms | 0.07ms | -0.0060ms | -8.59% |
| p95 | 0.15ms | 0.14ms | +0.0037ms | +2.58% |
| p99 | 0.20ms | 0.30ms | -0.10ms | -34.71% |
| mean | 0.08ms | 0.09ms | -0.01ms | -11.95% |
| min | 0.04ms | 0.05ms | -0.0075ms | -14.78% |
| max | 0.22ms | 0.39ms | -0.17ms | -43.31% |
| total | 3.05ms | 3.47ms | -0.41ms | -11.95% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.13ms |
| total | 1.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0039ms | -9.87% |
| p50 | 0.04ms | 0.04ms | -0.0044ms | -10.79% |
| p95 | 0.06ms | 0.06ms | -0.0045ms | -7.11% |
| p99 | 0.10ms | 0.13ms | -0.02ms | -17.90% |
| mean | 0.04ms | 0.05ms | -0.0057ms | -11.76% |
| min | 0.04ms | 0.04ms | -0.0042ms | -10.63% |
| max | 0.13ms | 0.16ms | -0.03ms | -18.07% |
| total | 1.71ms | 1.94ms | -0.23ms | -11.76% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.14ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00021ms | +0.64% |
| p50 | 0.03ms | 0.03ms | -0.000084ms | -0.25% |
| p95 | 0.04ms | 0.04ms | +0.0043ms | +11.49% |
| p99 | 0.10ms | 0.04ms | +0.06ms | +162.69% |
| mean | 0.04ms | 0.03ms | +0.0029ms | +8.56% |
| min | 0.03ms | 0.03ms | +0.0013ms | +3.98% |
| max | 0.14ms | 0.04ms | +0.10ms | +249.22% |
| total | 1.48ms | 1.36ms | +0.12ms | +8.56% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.07ms |
| p50 | 0.08ms |
| p95 | 0.17ms |
| p99 | 0.24ms |
| mean | 0.09ms |
| stdev | 0.04ms |
| min | 0.06ms |
| max | 0.27ms |
| total | 3.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.06ms | +0.0056ms | +9.25% |
| p50 | 0.08ms | 0.08ms | +0.0035ms | +4.53% |
| p95 | 0.17ms | 0.09ms | +0.08ms | +95.00% |
| p99 | 0.24ms | 0.15ms | +0.10ms | +65.17% |
| mean | 0.09ms | 0.08ms | +0.01ms | +16.58% |
| min | 0.06ms | 0.06ms | -0.0023ms | -3.84% |
| max | 0.27ms | 0.18ms | +0.08ms | +43.66% |
| total | 3.54ms | 3.03ms | +0.50ms | +16.58% |

