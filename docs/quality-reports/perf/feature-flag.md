# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00042ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00083ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| registerRule | 0.00025ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 22184 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 77448 B | 0 B | 102400 B | yes | PASS |
| registerRule | 20240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0013ms |
| p99 | 0.0060ms |
| mean | 0.00071ms |
| stdev | 0.00096ms |
| min | 0.00038ms |
| max | 0.0097ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00056ms | -0.000021ms | -3.64% |
| p95 | 0.0013ms | 0.0021ms | -0.00079ms | -37.09% |
| p99 | 0.0060ms | 0.0066ms | -0.00052ms | -7.99% |
| mean | 0.00071ms | 0.00081ms | -0.000099ms | -12.32% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.01ms | -0.0017ms | -14.96% |
| total | 0.14ms | 0.16ms | -0.02ms | -12.32% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0011ms |
| p99 | 0.0031ms |
| mean | 0.00095ms |
| stdev | 0.00035ms |
| min | 0.00079ms |
| max | 0.0043ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00092ms | -0.000042ms | -4.58% |
| p95 | 0.0011ms | 0.0012ms | -0.000039ms | -3.34% |
| p99 | 0.0031ms | 0.0020ms | +0.0011ms | +56.74% |
| mean | 0.00095ms | 0.00098ms | -0.000031ms | -3.13% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.0043ms | 0.0031ms | +0.0012ms | +37.85% |
| total | 0.19ms | 0.20ms | -0.0062ms | -3.13% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00034ms |
| p99 | 0.0022ms |
| mean | 0.00033ms |
| stdev | 0.00052ms |
| min | 0.00021ms |
| max | 0.0069ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p50 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p95 | 0.00034ms | 0.00038ms | -0.000039ms | -10.33% |
| p99 | 0.0022ms | 0.0018ms | +0.00037ms | +20.25% |
| mean | 0.00033ms | 0.00031ms | +0.000025ms | +8.15% |
| min | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| max | 0.0069ms | 0.0065ms | +0.00046ms | +7.09% |
| total | 0.07ms | 0.06ms | +0.0050ms | +8.15% |

