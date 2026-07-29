# Perf Suite — cli

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runSpecToTest | 0.09ms | 0.70ms | 20ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +195% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runSpecToTest | 4.47ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runSpecToTest | 4624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runSpecToTest

# Perf Report — runSpecToTest.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.70ms |
| p99 | 0.90ms |
| mean | 0.20ms |
| stdev | 0.21ms |
| min | 0.08ms |
| max | 1.17ms |
| total | 19.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0027ms | -2.97% |
| p50 | 0.11ms | 0.11ms | +0.0036ms | +3.33% |
| p95 | 0.70ms | 0.24ms | +0.46ms | +194.66% |
| p99 | 0.90ms | 4.86ms | -3.96ms | -81.57% |
| mean | 0.20ms | 0.23ms | -0.03ms | -15.02% |
| min | 0.08ms | 0.09ms | -0.0057ms | -6.66% |
| max | 1.17ms | 6.15ms | -4.98ms | -80.95% |
| total | 19.54ms | 22.99ms | -3.45ms | -15.02% |

