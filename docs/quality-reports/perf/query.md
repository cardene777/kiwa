# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| fetchQuery | 0.00046ms | 0.01ms | 5ms | 0.00082ms | PASS | stable (検知には +0.00082ms (baseline 比 +178%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| mutate | 0.00063ms | 0.0035ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +132%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invalidateQuery | 0.00029ms | 0.0016ms | 5ms | 0.00086ms | PASS | stable (検知には +0.00086ms (baseline 比 +295%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| fetchQuery | cpu | 0.08ms | 0.00046ms | 0.006 | 0.006 | 0.00045ms | 0.00046ms |
| mutate | cpu | 0.08ms | 0.00063ms | 0.008 | 0.008 | 0.00062ms | 0.00063ms |
| invalidateQuery | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -10840 B | 0 B | 102400 B | yes | PASS |
| mutate | -15008 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00052ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0022ms |
| stdev | 0.0048ms |
| min | 0.00042ms |
| max | 0.03ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00052ms | 0.00054ms | -0.000021ms | -3.79% |
| p95 | 0.01ms | 0.0041ms | +0.0081ms | +196.16% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +120.02% |
| mean | 0.0022ms | 0.0011ms | +0.0011ms | +97.36% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.02ms | +131.97% |
| total | 0.44ms | 0.22ms | +0.22ms | +97.36% |

### mutate

# Perf Report — mutate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0035ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0030ms |
| min | 0.00058ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00067ms | 0.00071ms | -0.000041ms | -5.79% |
| p95 | 0.0035ms | 0.0038ms | -0.00031ms | -8.17% |
| p99 | 0.02ms | 0.02ms | -0.00082ms | -4.90% |
| mean | 0.0015ms | 0.0015ms | +2.4e-7ms | +0.02% |
| min | 0.00058ms | 0.00058ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | -0.0075ms | -22.91% |
| total | 0.29ms | 0.29ms | +0.000048ms | +0.02% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.0016ms |
| p99 | 0.02ms |
| mean | 0.0011ms |
| stdev | 0.0056ms |
| min | 0.00025ms |
| max | 0.07ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0010ms | +0.00053ms | +51.35% |
| p99 | 0.02ms | 0.0095ms | +0.0060ms | +62.91% |
| mean | 0.0011ms | 0.00068ms | +0.00038ms | +55.93% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.07ms | 0.02ms | +0.06ms | +292.34% |
| total | 0.21ms | 0.14ms | +0.08ms | +55.93% |

