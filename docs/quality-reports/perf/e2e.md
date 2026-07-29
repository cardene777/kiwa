# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchOverLoopback | 0.15ms | 0.66ms | 20ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 2.27ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 218976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.15ms |
| p50 | 0.23ms |
| p95 | 0.66ms |
| p99 | 0.83ms |
| mean | 0.29ms |
| stdev | 0.16ms |
| min | 0.14ms |
| max | 1.03ms |
| total | 28.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.15ms | 0.14ms | +0.0098ms | +6.81% |
| p50 | 0.23ms | 0.17ms | +0.06ms | +34.12% |
| p95 | 0.66ms | 0.49ms | +0.17ms | +35.12% |
| p99 | 0.83ms | 0.66ms | +0.17ms | +26.43% |
| mean | 0.29ms | 0.22ms | +0.07ms | +30.57% |
| min | 0.14ms | 0.13ms | +0.0059ms | +4.55% |
| max | 1.03ms | 0.70ms | +0.33ms | +47.30% |
| total | 28.75ms | 22.02ms | +6.73ms | +30.57% |

