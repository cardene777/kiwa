# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00042ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00088ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable (p10 +5% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerRule | 0.00021ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 14624 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 70088 B | 0 B | 102400 B | yes | PASS |
| registerRule | 20144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00052ms |
| p95 | 0.0010ms |
| p99 | 0.0077ms |
| mean | 0.00079ms |
| stdev | 0.0018ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00052ms | 0.00056ms | -0.000041ms | -7.38% |
| p95 | 0.0010ms | 0.0021ms | -0.0011ms | -52.40% |
| p99 | 0.0077ms | 0.0066ms | +0.0012ms | +17.97% |
| mean | 0.00079ms | 0.00081ms | -0.000014ms | -1.77% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0096ms | +84.32% |
| total | 0.16ms | 0.16ms | -0.0028ms | -1.77% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00090ms |
| p95 | 0.0014ms |
| p99 | 0.0032ms |
| mean | 0.0020ms |
| stdev | 0.01ms |
| min | 0.00083ms |
| max | 0.20ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| p50 | 0.00090ms | 0.00092ms | -0.000021ms | -2.34% |
| p95 | 0.0014ms | 0.0012ms | +0.00025ms | +21.52% |
| p99 | 0.0032ms | 0.0020ms | +0.0012ms | +63.06% |
| mean | 0.0020ms | 0.00098ms | +0.00098ms | +99.82% |
| min | 0.00083ms | 0.00079ms | +0.000042ms | +5.31% |
| max | 0.20ms | 0.0031ms | +0.20ms | +6391.24% |
| total | 0.39ms | 0.20ms | +0.20ms | +99.82% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00038ms |
| p99 | 0.0019ms |
| mean | 0.00033ms |
| stdev | 0.00096ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p95 | 0.00038ms | 0.00038ms | +0.0000021ms | +0.56% |
| p99 | 0.0019ms | 0.0018ms | +0.000041ms | +2.24% |
| mean | 0.00033ms | 0.00031ms | +0.000023ms | +7.47% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0065ms | +0.0070ms | +109.04% |
| total | 0.07ms | 0.06ms | +0.0046ms | +7.47% |

