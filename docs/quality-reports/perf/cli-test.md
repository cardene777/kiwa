# Perf Suite — cli-test

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| writeFile | 0.12ms | 0.44ms | 20ms | 0.00033ms | PASS | stable (p10 +5% (閾値未満)、 p95 +72% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| readFile | 0.05ms | 0.12ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| writeFile | 0.53ms | 40ms | PASS |
| readFile | 0.13ms | 20ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| writeFile | 5616 B | 717 B | 102400 B | yes | PASS |
| readFile | 6424 B | -38725 B | 102400 B | yes | PASS |

## Detailed serial reports

### writeFile

# Perf Report — writeFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.16ms |
| p95 | 0.44ms |
| p99 | 0.53ms |
| mean | 0.20ms |
| stdev | 0.14ms |
| min | 0.10ms |
| max | 1.25ms |
| total | 20.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.11ms | +0.0057ms | +5.24% |
| p50 | 0.16ms | 0.16ms | -0.0062ms | -3.83% |
| p95 | 0.44ms | 0.26ms | +0.19ms | +72.33% |
| p99 | 0.53ms | 0.29ms | +0.24ms | +81.67% |
| mean | 0.20ms | 0.17ms | +0.04ms | +21.17% |
| min | 0.10ms | 0.10ms | +0.00063ms | +0.62% |
| max | 1.25ms | 0.32ms | +0.93ms | +294.21% |
| total | 20.09ms | 16.58ms | +3.51ms | +21.17% |

### readFile

# Perf Report — readFile.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.07ms |
| p95 | 0.12ms |
| p99 | 0.18ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.21ms |
| total | 7.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0021ms | +4.10% |
| p50 | 0.07ms | 0.07ms | -0.0017ms | -2.48% |
| p95 | 0.12ms | 0.50ms | -0.37ms | -75.48% |
| p99 | 0.18ms | 2.30ms | -2.11ms | -92.08% |
| mean | 0.08ms | 0.26ms | -0.19ms | -71.23% |
| min | 0.05ms | 0.04ms | +0.0013ms | +2.91% |
| max | 0.21ms | 10.04ms | -9.83ms | -97.86% |
| total | 7.52ms | 26.13ms | -18.61ms | -71.23% |

