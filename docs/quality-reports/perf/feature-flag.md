# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00042ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00083ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +68% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerRule | 0.00021ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 14768 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 70032 B | 0 B | 102400 B | yes | PASS |
| registerRule | 19136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00058ms |
| p95 | 0.0026ms |
| p99 | 0.0069ms |
| mean | 0.00088ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00058ms | 0.00056ms | +0.000021ms | +3.64% |
| p95 | 0.0026ms | 0.0021ms | +0.00046ms | +21.43% |
| p99 | 0.0069ms | 0.0066ms | +0.00030ms | +4.55% |
| mean | 0.00088ms | 0.00081ms | +0.000079ms | +9.79% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0022ms | +19.35% |
| total | 0.18ms | 0.16ms | +0.02ms | +9.79% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0020ms |
| p99 | 0.0035ms |
| mean | 0.0011ms |
| stdev | 0.00061ms |
| min | 0.00079ms |
| max | 0.0061ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| p95 | 0.0020ms | 0.0012ms | +0.00079ms | +68.00% |
| p99 | 0.0035ms | 0.0020ms | +0.0016ms | +80.00% |
| mean | 0.0011ms | 0.00098ms | +0.000095ms | +9.71% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.0061ms | 0.0031ms | +0.0030ms | +97.34% |
| total | 0.22ms | 0.20ms | +0.02ms | +9.71% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0020ms |
| mean | 0.00032ms |
| stdev | 0.00098ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00029ms | 0.00038ms | -0.000083ms | -22.01% |
| p99 | 0.0020ms | 0.0018ms | +0.00017ms | +9.00% |
| mean | 0.00032ms | 0.00031ms | +0.0000095ms | +3.10% |
| min | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| max | 0.01ms | 0.0065ms | +0.0073ms | +112.28% |
| total | 0.06ms | 0.06ms | +0.0019ms | +3.10% |

