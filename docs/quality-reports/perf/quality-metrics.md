# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00033ms | 0.0014ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00042ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffReports | 0.00038ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable (p10 -18% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -8408 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | -312 B | 0 B | 102400 B | yes | PASS |
| diffReports | 920 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00054ms |
| p95 | 0.0014ms |
| p99 | 0.0068ms |
| mean | 0.00077ms |
| stdev | 0.0015ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00092ms | -0.00058ms | -63.69% |
| p50 | 0.00054ms | 0.0013ms | -0.00075ms | -58.05% |
| p95 | 0.0014ms | 0.0031ms | -0.0017ms | -55.98% |
| p99 | 0.0068ms | 0.01ms | -0.0035ms | -34.23% |
| mean | 0.00077ms | 0.0015ms | -0.00077ms | -49.84% |
| min | 0.00033ms | 0.00088ms | -0.00054ms | -61.94% |
| max | 0.02ms | 0.02ms | +0.00092ms | +5.67% |
| total | 0.15ms | 0.31ms | -0.15ms | -49.84% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00054ms |
| p99 | 0.00088ms |
| mean | 0.00045ms |
| stdev | 0.00015ms |
| min | 0.00038ms |
| max | 0.0023ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00054ms | 0.00063ms | -0.000085ms | -13.57% |
| p99 | 0.00088ms | 0.0011ms | -0.00021ms | -19.31% |
| mean | 0.00045ms | 0.00047ms | -0.000013ms | -2.74% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0023ms | 0.0015ms | +0.00083ms | +57.09% |
| total | 0.09ms | 0.09ms | -0.0026ms | -2.74% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.01ms |
| mean | 0.00080ms |
| stdev | 0.0017ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000084ms | -18.28% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0011ms | 0.00079ms | +0.00026ms | +32.42% |
| p99 | 0.01ms | 0.0067ms | +0.0046ms | +67.87% |
| mean | 0.00080ms | 0.00073ms | +0.000064ms | +8.65% |
| min | 0.00033ms | 0.00046ms | -0.00013ms | -27.29% |
| max | 0.01ms | 0.01ms | +0.0023ms | +18.73% |
| total | 0.16ms | 0.15ms | +0.01ms | +8.65% |

