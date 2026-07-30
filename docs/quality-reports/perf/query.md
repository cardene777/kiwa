# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00050ms | 0.0043ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutate | 0.00067ms | 0.0024ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00033ms | 0.0050ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +119%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| fetchQuery | cpu | 0.09ms | 0.10ms | 0.00050ms | 0.006 | 0.006 | 0.00047ms | 0.00046ms |
| mutate | cpu | 0.09ms | 0.10ms | 0.00067ms | 0.008 | 0.008 | 0.00063ms | 0.00063ms |
| invalidateQuery | cpu | 0.09ms | 0.10ms | 0.00033ms | 0.004 | 0.003 | 0.00030ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -11200 B | 0 B | 102400 B | yes | PASS |
| mutate | -16488 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0043ms |
| p99 | 0.0093ms |
| mean | 0.0012ms |
| stdev | 0.0019ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.931)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00047ms | 0.00046ms | +0.0000077ms | +1.68% |
| p50 | 0.00054ms | 0.00050ms | +0.000043ms | +8.60% |
| p95 | 0.0040ms | 0.0043ms | -0.00031ms | -7.15% |
| p99 | 0.0086ms | 0.01ms | -0.0026ms | -23.37% |
| mean | 0.0011ms | 0.0011ms | +0.000045ms | +4.15% |
| min | 0.00043ms | 0.00042ms | +0.000011ms | +2.54% |
| max | 0.02ms | 0.01ms | +0.0034ms | +23.55% |
| total | 0.22ms | 0.22ms | +0.0090ms | +4.15% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0024ms |
| p99 | 0.02ms |
| mean | 0.0014ms |
| stdev | 0.0039ms |
| min | 0.00067ms |
| max | 0.05ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.950)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | +0.0000085ms | +1.36% |
| p50 | 0.00071ms | 0.00071ms | +0.0000043ms | +0.61% |
| p95 | 0.0023ms | 0.0041ms | -0.0019ms | -45.60% |
| p99 | 0.02ms | 0.02ms | -0.00017ms | -1.00% |
| mean | 0.0014ms | 0.0015ms | -0.00016ms | -10.54% |
| min | 0.00063ms | 0.00058ms | +0.000050ms | +8.49% |
| max | 0.04ms | 0.04ms | +0.0074ms | +20.44% |
| total | 0.27ms | 0.31ms | -0.03ms | -10.54% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0050ms |
| p99 | 0.02ms |
| mean | 0.0013ms |
| stdev | 0.0042ms |
| min | 0.00029ms |
| max | 0.04ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00025ms | +0.000049ms | +19.41% |
| p50 | 0.00034ms | 0.00029ms | +0.000044ms | +15.13% |
| p95 | 0.0045ms | 0.00054ms | +0.0039ms | +728.65% |
| p99 | 0.02ms | 0.0066ms | +0.01ms | +165.38% |
| mean | 0.0011ms | 0.00056ms | +0.00058ms | +104.03% |
| min | 0.00026ms | 0.00025ms | +0.000011ms | +4.35% |
| max | 0.04ms | 0.02ms | +0.02ms | +111.52% |
| total | 0.23ms | 0.11ms | +0.12ms | +104.03% |

