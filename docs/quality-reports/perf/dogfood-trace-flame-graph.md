# Perf Suite — dogfood-trace-flame-graph

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| loadTrace | 0.00033ms | 0.0048ms | 20ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +102%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderFlame | 0.00054ms | 0.0024ms | 30ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| drillDown | 0.00058ms | 0.01ms | 20ms | 0.00031ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +125% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| loadTrace | cpu | 0.09ms | 0.10ms | 0.00033ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |
| renderFlame | cpu | 0.09ms | 0.09ms | 0.00054ms | 0.006 | 0.007 | 0.00049ms | 0.00054ms |
| drillDown | cpu | 0.09ms | 0.15ms | 0.00058ms | 0.007 | 0.007 | 0.00054ms | 0.00054ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loadTrace | 0.01ms | 40ms | PASS |
| renderFlame | 0.02ms | 60ms | PASS |
| drillDown | 0.01ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loadTrace | 19112 B | -36703 B | 102400 B | yes | PASS |
| renderFlame | 23744 B | 0 B | 102400 B | yes | PASS |
| drillDown | 46616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loadTrace

# Perf Report — loadTrace.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00054ms |
| p95 | 0.0048ms |
| p99 | 0.0068ms |
| mean | 0.0012ms |
| stdev | 0.0016ms |
| min | 0.00029ms |
| max | 0.0075ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000053ms | +1.82% |
| p50 | 0.00048ms | 0.00042ms | +0.000066ms | +15.90% |
| p95 | 0.0042ms | 0.0032ms | +0.0011ms | +33.19% |
| p99 | 0.0061ms | 0.0045ms | +0.0015ms | +34.03% |
| mean | 0.0011ms | 0.00090ms | +0.00020ms | +21.76% |
| min | 0.00026ms | 0.00029ms | -0.000030ms | -10.44% |
| max | 0.0067ms | 0.0051ms | +0.0016ms | +30.61% |
| total | 0.04ms | 0.04ms | +0.0078ms | +21.76% |

### renderFlame

# Perf Report — renderFlame.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0024ms |
| p99 | 0.0038ms |
| mean | 0.0010ms |
| stdev | 0.00080ms |
| min | 0.00054ms |
| max | 0.0042ms |
| total | 0.04ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.913)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00054ms | -0.000046ms | -8.52% |
| p50 | 0.00057ms | 0.00054ms | +0.000029ms | +5.29% |
| p95 | 0.0022ms | 0.0025ms | -0.00034ms | -13.52% |
| p99 | 0.0035ms | 0.02ms | -0.01ms | -76.77% |
| mean | 0.00095ms | 0.0014ms | -0.00043ms | -31.23% |
| min | 0.00049ms | 0.00050ms | -0.0000060ms | -1.20% |
| max | 0.0038ms | 0.02ms | -0.02ms | -83.20% |
| total | 0.04ms | 0.06ms | -0.02ms | -31.23% |

### drillDown

# Perf Report — drillDown.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.0014ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0029ms |
| stdev | 0.0040ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.921)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | +3.2e-7ms | +0.06% |
| p50 | 0.0013ms | 0.00056ms | +0.00070ms | +125.25% |
| p95 | 0.01ms | 0.0049ms | +0.0062ms | +124.98% |
| p99 | 0.02ms | 0.0079ms | +0.0077ms | +97.63% |
| mean | 0.0026ms | 0.0012ms | +0.0014ms | +118.89% |
| min | 0.00050ms | 0.00050ms | -0.0000015ms | -0.30% |
| max | 0.02ms | 0.0090ms | +0.0069ms | +77.05% |
| total | 0.11ms | 0.05ms | +0.06ms | +118.89% |

