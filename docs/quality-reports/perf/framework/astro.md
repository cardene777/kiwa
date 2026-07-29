# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.02ms | 0.04ms | 5ms | 0.00083ms | PASS | regressed — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0054ms | 0.0083ms | 5ms | 0.00083ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.67ms | 10ms | PASS |
| invokeEndpoint | 0.09ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | 48560 B | -2072 B | 102400 B | yes | PASS |
| invokeEndpoint | -102192 B | -2448 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.0097ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 4.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0075ms | +68.97% |
| p50 | 0.02ms | 0.01ms | +0.0085ms | +69.16% |
| p95 | 0.04ms | 0.03ms | +0.0079ms | +27.72% |
| p99 | 0.07ms | 0.07ms | +0.0031ms | +4.56% |
| mean | 0.02ms | 0.02ms | +0.0079ms | +51.34% |
| min | 0.02ms | 0.0096ms | +0.0065ms | +67.96% |
| max | 0.11ms | 0.10ms | +0.01ms | +12.09% |
| total | 4.68ms | 3.10ms | +1.59ms | +51.34% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0054ms |
| p50 | 0.0056ms |
| p95 | 0.0083ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.0025ms |
| min | 0.0053ms |
| max | 0.03ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0077ms | -0.0023ms | -30.12% |
| p50 | 0.0056ms | 0.0080ms | -0.0024ms | -29.84% |
| p95 | 0.0083ms | 0.0091ms | -0.00087ms | -9.48% |
| p99 | 0.02ms | 0.02ms | +0.0052ms | +31.81% |
| mean | 0.0062ms | 0.0083ms | -0.0021ms | -25.28% |
| min | 0.0053ms | 0.0076ms | -0.0024ms | -31.15% |
| max | 0.03ms | 0.02ms | +0.0040ms | +18.06% |
| total | 1.24ms | 1.66ms | -0.42ms | -25.28% |

