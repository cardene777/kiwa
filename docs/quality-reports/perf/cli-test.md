# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.10ms | 0.32ms | 20ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| readFile | 0.06ms | 0.13ms | 10ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.40ms | 40ms | PASS |
| readFile | 0.16ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 2440 B | -17048 B | 102400 B | yes | PASS |
| readFile | 5128 B | -66816 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.14ms |
| p95 | 0.32ms |
| p99 | 0.39ms |
| mean | 0.17ms |
| stdev | 0.08ms |
| min | 0.09ms |
| max | 0.51ms |
| total | 16.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0077ms | -7.06% |
| p50 | 0.14ms | 0.16ms | -0.03ms | -15.75% |
| p95 | 0.32ms | 0.26ms | +0.07ms | +25.91% |
| p99 | 0.39ms | 0.29ms | +0.09ms | +32.15% |
| mean | 0.17ms | 0.17ms | -0.000048ms | -0.03% |
| min | 0.09ms | 0.10ms | -0.01ms | -10.16% |
| max | 0.51ms | 0.32ms | +0.19ms | +61.14% |
| total | 16.58ms | 16.58ms | -0.0048ms | -0.03% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.13ms |
| p99 | 0.18ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.22ms |
| total | 7.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.01ms | +22.67% |
| p50 | 0.07ms | 0.07ms | +0.0017ms | +2.36% |
| p95 | 0.13ms | 0.50ms | -0.36ms | -73.08% |
| p99 | 0.18ms | 2.30ms | -2.11ms | -92.00% |
| mean | 0.08ms | 0.26ms | -0.18ms | -69.88% |
| min | 0.05ms | 0.04ms | +0.0028ms | +6.20% |
| max | 0.22ms | 10.04ms | -9.82ms | -97.78% |
| total | 7.87ms | 26.13ms | -18.26ms | -69.88% |

