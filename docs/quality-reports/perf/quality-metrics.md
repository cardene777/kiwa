# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00038ms | 0.0017ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00042ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffReports | 0.00038ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.02ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -7824 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 600 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0017ms |
| p99 | 0.0071ms |
| mean | 0.00075ms |
| stdev | 0.0011ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00092ms | -0.00054ms | -59.11% |
| p50 | 0.00054ms | 0.0013ms | -0.00075ms | -58.13% |
| p95 | 0.0017ms | 0.0031ms | -0.0014ms | -46.35% |
| p99 | 0.0071ms | 0.01ms | -0.0032ms | -30.97% |
| mean | 0.00075ms | 0.0015ms | -0.00078ms | -50.94% |
| min | 0.00033ms | 0.00088ms | -0.00054ms | -61.94% |
| max | 0.01ms | 0.02ms | -0.0053ms | -32.98% |
| total | 0.15ms | 0.31ms | -0.16ms | -50.94% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00050ms |
| p99 | 0.00075ms |
| mean | 0.00045ms |
| stdev | 0.00015ms |
| min | 0.00038ms |
| max | 0.0024ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00063ms | -0.00013ms | -20.27% |
| p99 | 0.00075ms | 0.0011ms | -0.00034ms | -30.90% |
| mean | 0.00045ms | 0.00047ms | -0.000019ms | -4.12% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0024ms | 0.0015ms | +0.00096ms | +65.66% |
| total | 0.09ms | 0.09ms | -0.0038ms | -4.12% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00046ms |
| p95 | 0.00092ms |
| p99 | 0.0099ms |
| mean | 0.00070ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00046ms | -0.000084ms | -18.28% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.00092ms | 0.00079ms | +0.00013ms | +16.40% |
| p99 | 0.0099ms | 0.0067ms | +0.0032ms | +47.17% |
| mean | 0.00070ms | 0.00073ms | -0.000039ms | -5.34% |
| min | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| max | 0.01ms | 0.01ms | -0.00042ms | -3.34% |
| total | 0.14ms | 0.15ms | -0.0078ms | -5.34% |

