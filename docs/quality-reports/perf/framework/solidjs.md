# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderSolid | 0.00067ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +270% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mockSignalEffect | 0.00092ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderSolid | 12384 B | 0 B | 102400 B | yes | PASS |
| mockSignalEffect | -296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0057ms |
| p99 | 0.11ms |
| mean | 0.0040ms |
| stdev | 0.02ms |
| min | 0.00063ms |
| max | 0.18ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00063ms | +0.000041ms | +6.56% |
| p50 | 0.00075ms | 0.00067ms | +0.000083ms | +12.44% |
| p95 | 0.0057ms | 0.0015ms | +0.0042ms | +270.28% |
| p99 | 0.11ms | 0.0048ms | +0.10ms | +2138.27% |
| mean | 0.0040ms | 0.00083ms | +0.0032ms | +380.69% |
| min | 0.00063ms | 0.00058ms | +0.000042ms | +7.20% |
| max | 0.18ms | 0.0066ms | +0.17ms | +2619.97% |
| total | 0.80ms | 0.17ms | +0.63ms | +380.69% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00092ms |
| p95 | 0.0017ms |
| p99 | 0.0057ms |
| mean | 0.0012ms |
| stdev | 0.0010ms |
| min | 0.00088ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| p50 | 0.00092ms | 0.0010ms | -0.000083ms | -8.30% |
| p95 | 0.0017ms | 0.0018ms | -0.000077ms | -4.28% |
| p99 | 0.0057ms | 0.0057ms | +0.000028ms | +0.49% |
| mean | 0.0012ms | 0.0013ms | -0.000077ms | -6.00% |
| min | 0.00088ms | 0.00092ms | -0.000041ms | -4.48% |
| max | 0.01ms | 0.01ms | -0.0020ms | -15.66% |
| total | 0.24ms | 0.26ms | -0.02ms | -6.00% |

