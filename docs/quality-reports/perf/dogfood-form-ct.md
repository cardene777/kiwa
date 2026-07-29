# Perf Suite — dogfood-form-ct

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| mountAllForms | 0.05ms | 0.17ms | 50ms | 0.00041ms | PASS | stable (p10 -17% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| validateAllForms | 0.04ms | 0.08ms | 80ms | 0.00041ms | PASS | stable (p10 -1% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| submitAllForms | 0.03ms | 0.05ms | 80ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11yAllForms | 0.06ms | 0.11ms | 80ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| mountAllForms | cpu | 0.08ms | 0.05ms | 0.604 | 0.732 | 0.05ms | 0.06ms |
| validateAllForms | cpu | 0.08ms | 0.04ms | 0.439 | 0.443 | 0.04ms | 0.04ms |
| submitAllForms | cpu | 0.08ms | 0.03ms | 0.331 | 0.341 | 0.03ms | 0.03ms |
| a11yAllForms | cpu | 0.08ms | 0.06ms | 0.698 | 0.713 | 0.06ms | 0.06ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| mountAllForms | 0.92ms | 100ms | PASS |
| validateAllForms | 0.61ms | 160ms | PASS |
| submitAllForms | 0.44ms | 160ms | PASS |
| a11yAllForms | 1.11ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| mountAllForms | 7912 B | 0 B | 102400 B | yes | PASS |
| validateAllForms | -57792 B | 0 B | 102400 B | yes | PASS |
| submitAllForms | -24192 B | 0 B | 102400 B | yes | PASS |
| a11yAllForms | -4032 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### mountAllForms

# Perf Report — mountAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.17ms |
| p99 | 0.25ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.28ms |
| total | 3.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.06ms | -0.0096ms | -16.14% |
| p50 | 0.06ms | 0.07ms | -0.0015ms | -2.27% |
| p95 | 0.17ms | 0.12ms | +0.05ms | +37.99% |
| p99 | 0.25ms | 0.21ms | +0.04ms | +18.89% |
| mean | 0.08ms | 0.08ms | +0.0026ms | +3.29% |
| min | 0.05ms | 0.05ms | -0.00071ms | -1.53% |
| max | 0.28ms | 0.26ms | +0.02ms | +7.32% |
| total | 3.25ms | 3.15ms | +0.10ms | +3.29% |

### validateAllForms

# Perf Report — validateAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.15ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.19ms |
| total | 1.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00055ms | +1.55% |
| p50 | 0.04ms | 0.04ms | +0.00023ms | +0.61% |
| p95 | 0.08ms | 0.06ms | +0.02ms | +32.03% |
| p99 | 0.15ms | 0.17ms | -0.02ms | -11.77% |
| mean | 0.05ms | 0.05ms | +0.0016ms | +3.54% |
| min | 0.04ms | 0.03ms | +0.00087ms | +2.50% |
| max | 0.19ms | 0.23ms | -0.03ms | -15.18% |
| total | 1.90ms | 1.83ms | +0.06ms | +3.54% |

### submitAllForms

# Perf Report — submitAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00070ms | -2.50% |
| p50 | 0.03ms | 0.03ms | -0.0056ms | -16.45% |
| p95 | 0.05ms | 0.05ms | -0.000046ms | -0.10% |
| p99 | 0.09ms | 0.05ms | +0.04ms | +76.96% |
| mean | 0.03ms | 0.03ms | -0.0010ms | -3.05% |
| min | 0.03ms | 0.03ms | -0.00058ms | -2.09% |
| max | 0.10ms | 0.05ms | +0.05ms | +105.07% |
| total | 1.33ms | 1.37ms | -0.04ms | -3.05% |

### a11yAllForms

# Perf Report — a11yAllForms.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.11ms |
| p99 | 0.21ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.25ms |
| total | 3.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | +0.00069ms | +1.20% |
| p50 | 0.06ms | 0.06ms | -0.0035ms | -5.46% |
| p95 | 0.11ms | 0.11ms | +0.0063ms | +5.91% |
| p99 | 0.21ms | 0.20ms | +0.0084ms | +4.17% |
| mean | 0.08ms | 0.08ms | +0.00039ms | +0.52% |
| min | 0.06ms | 0.06ms | +0.00092ms | +1.63% |
| max | 0.25ms | 0.26ms | -0.0083ms | -3.26% |
| total | 3.02ms | 3.00ms | +0.02ms | +0.52% |

