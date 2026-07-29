# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00054ms | 0.0019ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00050ms | 0.00058ms | 5ms | 0.00033ms | PASS | stable (差 0.000084ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| diffReports | 0.00050ms | 0.00081ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.03ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 8712 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 440 B | 0 B | 102400 B | yes | PASS |
| diffReports | 22520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0019ms |
| p99 | 0.0078ms |
| mean | 0.00092ms |
| stdev | 0.0012ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00092ms | -0.00038ms | -40.89% |
| p50 | 0.00063ms | 0.0013ms | -0.00067ms | -51.63% |
| p95 | 0.0019ms | 0.0031ms | -0.0012ms | -37.84% |
| p99 | 0.0078ms | 0.01ms | -0.0025ms | -23.98% |
| mean | 0.00092ms | 0.0015ms | -0.00062ms | -40.11% |
| min | 0.00050ms | 0.00088ms | -0.00038ms | -42.86% |
| max | 0.01ms | 0.02ms | -0.0061ms | -37.62% |
| total | 0.18ms | 0.31ms | -0.12ms | -40.11% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.00058ms |
| p99 | 0.0012ms |
| mean | 0.00056ms |
| stdev | 0.00036ms |
| min | 0.00046ms |
| max | 0.0055ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00042ms | +0.000084ms | +20.19% |
| p50 | 0.00050ms | 0.00042ms | +0.000083ms | +19.90% |
| p95 | 0.00058ms | 0.00063ms | -0.000044ms | -7.02% |
| p99 | 0.0012ms | 0.0011ms | +0.000081ms | +7.49% |
| mean | 0.00056ms | 0.00047ms | +0.000093ms | +19.91% |
| min | 0.00046ms | 0.00038ms | +0.000083ms | +22.13% |
| max | 0.0055ms | 0.0015ms | +0.0040ms | +274.09% |
| total | 0.11ms | 0.09ms | +0.02ms | +19.91% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00081ms |
| p99 | 0.01ms |
| mean | 0.00081ms |
| stdev | 0.0017ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000041ms | +8.96% |
| p50 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p95 | 0.00081ms | 0.00079ms | +0.000013ms | +1.70% |
| p99 | 0.01ms | 0.0067ms | +0.0067ms | +98.92% |
| mean | 0.00081ms | 0.00073ms | +0.000078ms | +10.64% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.02ms | 0.01ms | +0.0026ms | +21.07% |
| total | 0.16ms | 0.15ms | +0.02ms | +10.64% |

