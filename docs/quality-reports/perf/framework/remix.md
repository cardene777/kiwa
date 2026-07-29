# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0036ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0027ms | 0.0065ms | 5ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.06ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -54288 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -3648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0041ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0055ms |
| stdev | 0.0049ms |
| min | 0.0031ms |
| max | 0.05ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0033ms | +0.00028ms | +8.59% |
| p50 | 0.0041ms | 0.0040ms | +0.000084ms | +2.10% |
| p95 | 0.01ms | 0.01ms | +0.00095ms | +7.84% |
| p99 | 0.03ms | 0.03ms | -0.00094ms | -3.08% |
| mean | 0.0055ms | 0.0054ms | +0.000088ms | +1.63% |
| min | 0.0031ms | 0.0031ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.05ms | -0.0013ms | -2.67% |
| total | 1.09ms | 1.08ms | +0.02ms | +1.63% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0065ms |
| p99 | 0.04ms |
| mean | 0.0041ms |
| stdev | 0.0084ms |
| min | 0.0026ms |
| max | 0.11ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.000046ms | -1.70% |
| p50 | 0.0027ms | 0.0027ms | 0.00ms | 0.00% |
| p95 | 0.0065ms | 0.0040ms | +0.0025ms | +60.73% |
| p99 | 0.04ms | 0.0083ms | +0.03ms | +354.34% |
| mean | 0.0041ms | 0.0030ms | +0.0012ms | +38.46% |
| min | 0.0026ms | 0.0026ms | 0.00ms | 0.00% |
| max | 0.11ms | 0.01ms | +0.09ms | +655.09% |
| total | 0.83ms | 0.60ms | +0.23ms | +38.46% |

