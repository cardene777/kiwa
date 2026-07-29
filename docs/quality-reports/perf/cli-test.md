# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.34ms | 5.99ms | 20ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| readFile | 0.08ms | 0.24ms | 10ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 1.77ms | 40ms | PASS |
| readFile | 0.28ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 5568 B | -128000 B | 102400 B | yes | PASS |
| readFile | 5560 B | -104260 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.34ms |
| p50 | 0.79ms |
| p95 | 5.99ms |
| p99 | 13.79ms |
| mean | 1.76ms |
| stdev | 3.40ms |
| min | 0.19ms |
| max | 28.93ms |
| total | 176.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.34ms | 0.11ms | +0.23ms | +212.14% |
| p50 | 0.79ms | 0.16ms | +0.63ms | +388.19% |
| p95 | 5.99ms | 0.26ms | +5.74ms | +2228.77% |
| p99 | 13.79ms | 0.29ms | +13.50ms | +4586.76% |
| mean | 1.76ms | 0.17ms | +1.60ms | +962.14% |
| min | 0.19ms | 0.10ms | +0.09ms | +90.04% |
| max | 28.93ms | 0.32ms | +28.61ms | +9056.20% |
| total | 176.12ms | 16.58ms | +159.54ms | +962.14% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.08ms |
| p50 | 0.14ms |
| p95 | 0.24ms |
| p99 | 0.30ms |
| mean | 0.14ms |
| stdev | 0.06ms |
| min | 0.05ms |
| max | 0.30ms |
| total | 14.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.08ms | 0.05ms | +0.03ms | +49.96% |
| p50 | 0.14ms | 0.07ms | +0.07ms | +94.31% |
| p95 | 0.24ms | 0.50ms | -0.25ms | -51.13% |
| p99 | 0.30ms | 2.30ms | -1.99ms | -86.84% |
| mean | 0.14ms | 0.26ms | -0.12ms | -45.48% |
| min | 0.05ms | 0.04ms | +0.0066ms | +14.83% |
| max | 0.30ms | 10.04ms | -9.74ms | -96.98% |
| total | 14.25ms | 26.13ms | -11.89ms | -45.48% |

