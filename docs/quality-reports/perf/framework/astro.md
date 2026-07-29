# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.05ms | 5ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +70% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0087ms | 0.01ms | 5ms | 0.00042ms | PASS | stable (p10 +12% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.17ms | 10ms | PASS |
| invokeEndpoint | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | 29992 B | -28 B | 102400 B | yes | PASS |
| invokeEndpoint | -5120 B | -2640 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.59ms |
| total | 4.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00025ms | +2.30% |
| p50 | 0.01ms | 0.01ms | +0.0025ms | +20.44% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +70.00% |
| p99 | 0.10ms | 0.07ms | +0.04ms | +55.86% |
| mean | 0.02ms | 0.02ms | +0.0066ms | +42.50% |
| min | 0.01ms | 0.0096ms | +0.00092ms | +9.53% |
| max | 0.59ms | 0.10ms | +0.49ms | +511.36% |
| total | 4.41ms | 3.10ms | +1.32ms | +42.50% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0087ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0021ms |
| min | 0.0085ms |
| max | 0.03ms |
| total | 1.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0087ms | 0.0077ms | +0.00092ms | +11.83% |
| p50 | 0.0088ms | 0.0080ms | +0.00088ms | +11.00% |
| p95 | 0.01ms | 0.0091ms | +0.0022ms | +23.94% |
| p99 | 0.02ms | 0.02ms | +0.0054ms | +33.32% |
| mean | 0.0094ms | 0.0083ms | +0.0011ms | +12.63% |
| min | 0.0085ms | 0.0076ms | +0.00092ms | +12.01% |
| max | 0.03ms | 0.02ms | +0.0027ms | +12.10% |
| total | 1.87ms | 1.66ms | +0.21ms | +12.63% |

