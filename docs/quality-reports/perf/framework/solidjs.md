# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00079ms | 0.0024ms | 5ms | 0.00083ms | PASS | stable (差 0.00017ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.0010ms | 0.0095ms | 5ms | 0.00083ms | PASS | stable (p10 +9% (閾値未満)、 p95 +430% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.18ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | 13848 B | -493 B | 102400 B | yes | PASS |
| mockSignalEffect | -168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0024ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0045ms |
| min | 0.00067ms |
| max | 0.06ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00063ms | +0.00017ms | +26.56% |
| p50 | 0.00083ms | 0.00067ms | +0.00017ms | +24.96% |
| p95 | 0.0024ms | 0.0015ms | +0.00081ms | +52.24% |
| p99 | 0.01ms | 0.0048ms | +0.0085ms | +174.67% |
| mean | 0.0016ms | 0.00083ms | +0.00079ms | +94.94% |
| min | 0.00067ms | 0.00058ms | +0.000084ms | +14.41% |
| max | 0.06ms | 0.0066ms | +0.06ms | +835.98% |
| total | 0.33ms | 0.17ms | +0.16ms | +94.94% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0095ms |
| p99 | 0.03ms |
| mean | 0.0030ms |
| stdev | 0.0098ms |
| min | 0.0010ms |
| max | 0.13ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00096ms | +0.000083ms | +8.66% |
| p50 | 0.0011ms | 0.0010ms | +0.00010ms | +10.45% |
| p95 | 0.0095ms | 0.0018ms | +0.0077ms | +429.67% |
| p99 | 0.03ms | 0.0057ms | +0.02ms | +379.43% |
| mean | 0.0030ms | 0.0013ms | +0.0018ms | +138.50% |
| min | 0.0010ms | 0.00092ms | +0.000084ms | +9.17% |
| max | 0.13ms | 0.01ms | +0.12ms | +922.33% |
| total | 0.61ms | 0.26ms | +0.35ms | +138.50% |

