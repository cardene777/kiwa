# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00038ms | 0.00093ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00038ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffReports | 0.00038ms | 0.00074ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.02ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 84752 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 520 B | 0 B | 102400 B | yes | PASS |
| diffReports | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00054ms |
| p95 | 0.00093ms |
| p99 | 0.0071ms |
| mean | 0.00072ms |
| stdev | 0.0015ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00092ms | -0.00054ms | -59.11% |
| p50 | 0.00054ms | 0.0013ms | -0.00075ms | -58.05% |
| p95 | 0.00093ms | 0.0031ms | -0.0022ms | -69.96% |
| p99 | 0.0071ms | 0.01ms | -0.0032ms | -30.98% |
| mean | 0.00072ms | 0.0015ms | -0.00082ms | -53.04% |
| min | 0.00033ms | 0.00088ms | -0.00054ms | -61.94% |
| max | 0.02ms | 0.02ms | +0.0022ms | +13.92% |
| total | 0.14ms | 0.31ms | -0.16ms | -53.04% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00050ms |
| p99 | 0.0029ms |
| mean | 0.0011ms |
| stdev | 0.0091ms |
| min | 0.00038ms |
| max | 0.13ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00063ms | -0.00013ms | -20.27% |
| p99 | 0.0029ms | 0.0011ms | +0.0018ms | +167.28% |
| mean | 0.0011ms | 0.00047ms | +0.00064ms | +137.95% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.13ms | 0.0015ms | +0.13ms | +8741.67% |
| total | 0.22ms | 0.09ms | +0.13ms | +137.95% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.00074ms |
| p99 | 0.0066ms |
| mean | 0.00068ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000084ms | -18.28% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.00074ms | 0.00079ms | -0.000050ms | -6.27% |
| p99 | 0.0066ms | 0.0067ms | -0.00013ms | -1.95% |
| mean | 0.00068ms | 0.00073ms | -0.000053ms | -7.23% |
| min | 0.00033ms | 0.00046ms | -0.00013ms | -27.29% |
| max | 0.01ms | 0.01ms | +0.00062ms | +5.02% |
| total | 0.14ms | 0.15ms | -0.01ms | -7.23% |

