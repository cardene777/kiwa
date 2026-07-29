# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0075ms | 0.01ms | 5ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.23ms | 10ms | PASS |
| invokeEndpoint | 0.12ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -110864 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -9856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.0097ms |
| min | 0.0099ms |
| max | 0.10ms |
| total | 2.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0000042ms | -0.04% |
| p50 | 0.01ms | 0.01ms | -0.00042ms | -3.41% |
| p95 | 0.03ms | 0.03ms | -0.0023ms | -8.07% |
| p99 | 0.06ms | 0.07ms | -0.0040ms | -5.96% |
| mean | 0.01ms | 0.02ms | -0.00056ms | -3.59% |
| min | 0.0099ms | 0.0096ms | +0.00029ms | +3.03% |
| max | 0.10ms | 0.10ms | +0.00038ms | +0.39% |
| total | 2.98ms | 3.10ms | -0.11ms | -3.59% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0075ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0074ms |
| min | 0.0073ms |
| max | 0.11ms |
| total | 1.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0077ms | -0.00029ms | -3.77% |
| p50 | 0.0076ms | 0.0080ms | -0.00033ms | -4.18% |
| p95 | 0.01ms | 0.0091ms | +0.0020ms | +21.76% |
| p99 | 0.02ms | 0.02ms | +0.0058ms | +35.78% |
| mean | 0.0087ms | 0.0083ms | +0.00035ms | +4.17% |
| min | 0.0073ms | 0.0076ms | -0.00033ms | -4.37% |
| max | 0.11ms | 0.02ms | +0.09ms | +385.29% |
| total | 1.73ms | 1.66ms | +0.07ms | +4.17% |

