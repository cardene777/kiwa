# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.13ms | 50ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.18ms | 80ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +184% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.11ms | 80ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.50ms | 100ms | PASS |
| validateAllForms | 0.48ms | 160ms | PASS |
| submitAllForms | 0.38ms | 160ms | PASS |
| a11yAllForms | 0.65ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 80 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -58624 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -24224 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -3832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.13ms |
| p99 | 0.23ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.04ms |
| max | 0.28ms |
| total | 3.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.02ms | -26.59% |
| p50 | 0.06ms | 0.07ms | -0.0060ms | -8.56% |
| p95 | 0.13ms | 0.14ms | -0.02ms | -11.00% |
| p99 | 0.23ms | 0.30ms | -0.07ms | -24.62% |
| mean | 0.08ms | 0.09ms | -0.0096ms | -11.06% |
| min | 0.04ms | 0.05ms | -0.0069ms | -13.55% |
| max | 0.28ms | 0.39ms | -0.11ms | -27.60% |
| total | 3.08ms | 3.47ms | -0.38ms | -11.06% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.18ms |
| p99 | 0.23ms |
| mean | 0.06ms |
| stdev | 0.05ms |
| min | 0.04ms |
| max | 0.23ms |
| total | 2.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0038ms | -9.59% |
| p50 | 0.04ms | 0.04ms | -0.0014ms | -3.29% |
| p95 | 0.18ms | 0.06ms | +0.12ms | +184.27% |
| p99 | 0.23ms | 0.13ms | +0.10ms | +82.29% |
| mean | 0.06ms | 0.05ms | +0.01ms | +20.81% |
| min | 0.04ms | 0.04ms | -0.0038ms | -9.78% |
| max | 0.23ms | 0.16ms | +0.07ms | +44.09% |
| total | 2.34ms | 1.94ms | +0.40ms | +20.81% |

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
| max | 0.13ms |
| total | 1.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00055ms | -1.69% |
| p50 | 0.03ms | 0.03ms | -0.00015ms | -0.43% |
| p95 | 0.04ms | 0.04ms | +0.0058ms | +15.43% |
| p99 | 0.10ms | 0.04ms | +0.06ms | +145.88% |
| mean | 0.04ms | 0.03ms | +0.0026ms | +7.52% |
| min | 0.03ms | 0.03ms | -0.0033ms | -10.49% |
| max | 0.13ms | 0.04ms | +0.09ms | +223.05% |
| total | 1.47ms | 1.36ms | +0.10ms | +7.52% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.08ms |
| p95 | 0.11ms |
| p99 | 0.22ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.25ms |
| total | 3.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0023ms | -3.76% |
| p50 | 0.08ms | 0.08ms | +0.0058ms | +7.53% |
| p95 | 0.11ms | 0.09ms | +0.03ms | +29.48% |
| p99 | 0.22ms | 0.15ms | +0.07ms | +47.85% |
| mean | 0.08ms | 0.08ms | +0.0075ms | +9.85% |
| min | 0.06ms | 0.06ms | -0.0027ms | -4.61% |
| max | 0.25ms | 0.18ms | +0.07ms | +36.96% |
| total | 3.33ms | 3.03ms | +0.30ms | +9.85% |

