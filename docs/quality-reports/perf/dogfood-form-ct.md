# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.06ms | 0.14ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.06ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.13ms | 80ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.50ms | 100ms | PASS |
| validateAllForms | 0.46ms | 160ms | PASS |
| submitAllForms | 0.42ms | 160ms | PASS |
| a11yAllForms | 0.71ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 80 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -58384 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -24224 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -3952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.08ms |
| p95 | 0.14ms |
| p99 | 0.24ms |
| mean | 0.09ms |
| stdev | 0.04ms |
| min | 0.05ms |
| max | 0.30ms |
| total | 3.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.00015ms | -0.25% |
| p50 | 0.08ms | 0.07ms | +0.0065ms | +9.24% |
| p95 | 0.14ms | 0.14ms | -0.0059ms | -4.09% |
| p99 | 0.24ms | 0.30ms | -0.06ms | -19.09% |
| mean | 0.09ms | 0.09ms | +0.0023ms | +2.70% |
| min | 0.05ms | 0.05ms | +0.0041ms | +8.05% |
| max | 0.30ms | 0.39ms | -0.09ms | -23.78% |
| total | 3.56ms | 3.47ms | +0.09ms | +2.70% |

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
| total | 1.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0045ms | -11.44% |
| p50 | 0.04ms | 0.04ms | -0.0049ms | -12.01% |
| p95 | 0.06ms | 0.06ms | -0.0053ms | -8.32% |
| p99 | 0.11ms | 0.13ms | -0.02ms | -12.69% |
| mean | 0.04ms | 0.05ms | -0.0057ms | -11.85% |
| min | 0.04ms | 0.04ms | -0.0042ms | -10.73% |
| max | 0.14ms | 0.16ms | -0.02ms | -11.29% |
| total | 1.71ms | 1.94ms | -0.23ms | -11.85% |

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
| max | 0.12ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00050ms | -1.54% |
| p50 | 0.03ms | 0.03ms | -0.00013ms | -0.37% |
| p95 | 0.04ms | 0.04ms | +0.0022ms | +5.86% |
| p99 | 0.09ms | 0.04ms | +0.05ms | +124.74% |
| mean | 0.04ms | 0.03ms | +0.0018ms | +5.32% |
| min | 0.03ms | 0.03ms | +0.00033ms | +1.06% |
| max | 0.12ms | 0.04ms | +0.08ms | +188.58% |
| total | 1.44ms | 1.36ms | +0.07ms | +5.32% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.13ms |
| p99 | 0.26ms |
| mean | 0.09ms |
| stdev | 0.04ms |
| min | 0.06ms |
| max | 0.28ms |
| total | 3.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0020ms | -3.35% |
| p50 | 0.07ms | 0.08ms | -0.0029ms | -3.84% |
| p95 | 0.13ms | 0.09ms | +0.04ms | +51.02% |
| p99 | 0.26ms | 0.15ms | +0.11ms | +74.65% |
| mean | 0.09ms | 0.08ms | +0.0095ms | +12.48% |
| min | 0.06ms | 0.06ms | -0.0032ms | -5.45% |
| max | 0.28ms | 0.18ms | +0.10ms | +51.81% |
| total | 3.41ms | 3.03ms | +0.38ms | +12.48% |

