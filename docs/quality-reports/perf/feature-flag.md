# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00042ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00088ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable (p10 +5% (閾値未満)、 p95 +126% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerRule | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.02ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 18104 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 71264 B | 0 B | 102400 B | yes | PASS |
| registerRule | 19136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0013ms |
| p99 | 0.0086ms |
| mean | 0.00082ms |
| stdev | 0.0024ms |
| min | 0.00033ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00056ms | -0.00015ms | -25.87% |
| p95 | 0.0013ms | 0.0021ms | -0.00079ms | -37.23% |
| p99 | 0.0086ms | 0.0066ms | +0.0021ms | +31.61% |
| mean | 0.00082ms | 0.00081ms | +0.000019ms | +2.32% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.03ms | 0.01ms | +0.02ms | +151.11% |
| total | 0.16ms | 0.16ms | +0.0037ms | +2.32% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0026ms |
| p99 | 0.0040ms |
| mean | 0.0012ms |
| stdev | 0.00064ms |
| min | 0.00083ms |
| max | 0.0046ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| p50 | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| p95 | 0.0026ms | 0.0012ms | +0.0015ms | +126.19% |
| p99 | 0.0040ms | 0.0020ms | +0.0020ms | +103.46% |
| mean | 0.0012ms | 0.00098ms | +0.00017ms | +17.43% |
| min | 0.00083ms | 0.00079ms | +0.000042ms | +5.31% |
| max | 0.0046ms | 0.0031ms | +0.0015ms | +50.02% |
| total | 0.23ms | 0.20ms | +0.03ms | +17.43% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00033ms |
| p99 | 0.0018ms |
| mean | 0.00033ms |
| stdev | 0.0011ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p95 | 0.00033ms | 0.00038ms | -0.000044ms | -11.68% |
| p99 | 0.0018ms | 0.0018ms | -0.0000021ms | -0.11% |
| mean | 0.00033ms | 0.00031ms | +0.000022ms | +7.18% |
| min | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| max | 0.02ms | 0.0065ms | +0.0086ms | +132.92% |
| total | 0.07ms | 0.06ms | +0.0044ms | +7.18% |

