# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00067ms | 0.0010ms | 5ms | 0.00042ms | PASS | stable (差 0.00025ms が下限 0.00042ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00046ms | 0.00054ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffReports | 0.00050ms | 0.00070ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.02ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -11296 B | -47494 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 9448 B | 0 B | 102400 B | yes | PASS |
| diffReports | 12816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00067ms |
| p95 | 0.0010ms |
| p99 | 0.0063ms |
| mean | 0.00084ms |
| stdev | 0.00091ms |
| min | 0.00063ms |
| max | 0.0086ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00092ms | -0.00025ms | -27.37% |
| p50 | 0.00067ms | 0.0013ms | -0.00063ms | -48.37% |
| p95 | 0.0010ms | 0.0031ms | -0.0020ms | -66.04% |
| p99 | 0.0063ms | 0.01ms | -0.0039ms | -38.14% |
| mean | 0.00084ms | 0.0015ms | -0.00070ms | -45.61% |
| min | 0.00063ms | 0.00088ms | -0.00025ms | -28.57% |
| max | 0.0086ms | 0.02ms | -0.0076ms | -46.90% |
| total | 0.17ms | 0.31ms | -0.14ms | -45.61% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00054ms |
| p99 | 0.0011ms |
| mean | 0.00050ms |
| stdev | 0.00023ms |
| min | 0.00042ms |
| max | 0.0033ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.00054ms | 0.00063ms | -0.000086ms | -13.72% |
| p99 | 0.0011ms | 0.0011ms | +0.000044ms | +4.10% |
| mean | 0.00050ms | 0.00047ms | +0.000033ms | +6.98% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0033ms | 0.0015ms | +0.0018ms | +125.63% |
| total | 0.10ms | 0.09ms | +0.0065ms | +6.98% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.00070ms |
| p99 | 0.01ms |
| mean | 0.00082ms |
| stdev | 0.0019ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000041ms | +8.96% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00070ms | 0.00079ms | -0.000096ms | -12.08% |
| p99 | 0.01ms | 0.0067ms | +0.0080ms | +118.24% |
| mean | 0.00082ms | 0.00073ms | +0.000090ms | +12.31% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0036ms | +29.10% |
| total | 0.16ms | 0.15ms | +0.02ms | +12.31% |

