# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00054ms | 0.0016ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00042ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffReports | 0.00046ms | 0.00068ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -2760 B | -48061 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | -328 B | 0 B | 102400 B | yes | PASS |
| diffReports | 9120 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.0016ms |
| p99 | 0.0036ms |
| mean | 0.00075ms |
| stdev | 0.00099ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00092ms | -0.00038ms | -41.00% |
| p50 | 0.00054ms | 0.0013ms | -0.00075ms | -58.05% |
| p95 | 0.0016ms | 0.0031ms | -0.0015ms | -47.29% |
| p99 | 0.0036ms | 0.01ms | -0.0066ms | -64.61% |
| mean | 0.00075ms | 0.0015ms | -0.00079ms | -51.48% |
| min | 0.00050ms | 0.00088ms | -0.00038ms | -42.86% |
| max | 0.01ms | 0.02ms | -0.0057ms | -35.05% |
| total | 0.15ms | 0.31ms | -0.16ms | -51.48% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.00054ms |
| p99 | 0.0012ms |
| mean | 0.00048ms |
| stdev | 0.00020ms |
| min | 0.00042ms |
| max | 0.0030ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000010ms | +0.24% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.00054ms | 0.00063ms | -0.000085ms | -13.57% |
| p99 | 0.0012ms | 0.0011ms | +0.000082ms | +7.58% |
| mean | 0.00048ms | 0.00047ms | +0.000013ms | +2.82% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0030ms | 0.0015ms | +0.0015ms | +105.62% |
| total | 0.10ms | 0.09ms | +0.0026ms | +2.82% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00068ms |
| p99 | 0.01ms |
| mean | 0.00079ms |
| stdev | 0.0017ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | -9.0e-7ms | -0.20% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00068ms | 0.00079ms | -0.00011ms | -13.81% |
| p99 | 0.01ms | 0.0067ms | +0.0063ms | +92.78% |
| mean | 0.00079ms | 0.00073ms | +0.000059ms | +7.97% |
| min | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| max | 0.02ms | 0.01ms | +0.0039ms | +31.44% |
| total | 0.16ms | 0.15ms | +0.01ms | +7.97% |

