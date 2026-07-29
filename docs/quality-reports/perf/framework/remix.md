# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0051ms | 0.02ms | 5ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| invokeAction | 0.0030ms | 0.0044ms | 5ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.07ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -19608 B | 0 B | 102400 B | yes | PASS |
| invokeAction | 16664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0051ms |
| p50 | 0.0064ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0080ms |
| stdev | 0.0066ms |
| min | 0.0041ms |
| max | 0.06ms |
| total | 1.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0033ms | +0.0018ms | +55.68% |
| p50 | 0.0064ms | 0.0040ms | +0.0024ms | +60.94% |
| p95 | 0.02ms | 0.01ms | +0.0047ms | +38.71% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +45.38% |
| mean | 0.0080ms | 0.0054ms | +0.0026ms | +49.15% |
| min | 0.0041ms | 0.0031ms | +0.0010ms | +32.00% |
| max | 0.06ms | 0.05ms | +0.01ms | +30.16% |
| total | 1.60ms | 1.08ms | +0.53ms | +49.15% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0044ms |
| p99 | 0.0064ms |
| mean | 0.0033ms |
| stdev | 0.00078ms |
| min | 0.0030ms |
| max | 0.01ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0027ms | +0.00033ms | +12.33% |
| p50 | 0.0031ms | 0.0027ms | +0.00038ms | +13.64% |
| p95 | 0.0044ms | 0.0040ms | +0.00034ms | +8.44% |
| p99 | 0.0064ms | 0.0083ms | -0.0019ms | -23.06% |
| mean | 0.0033ms | 0.0030ms | +0.00030ms | +10.16% |
| min | 0.0030ms | 0.0026ms | +0.00038ms | +14.52% |
| max | 0.01ms | 0.01ms | -0.0032ms | -22.58% |
| total | 0.66ms | 0.60ms | +0.06ms | +10.16% |

