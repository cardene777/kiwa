# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| parseSpec | 0.0026ms | 0.02ms | 5ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| createPool | 0.0011ms | 0.0035ms | 5ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| parseSpec | cpu | 0.08ms | 0.09ms | 0.0026ms | 0.032 | 0.046 | 0.0026ms | 0.0037ms |
| createPool | cpu | 0.08ms | 0.08ms | 0.0011ms | 0.013 | 0.014 | 0.0011ms | 0.0011ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.04ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | -584 B | 0 B | 102400 B | yes | PASS |
| createPool | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0053ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.07ms |
| min | 0.0025ms |
| max | 0.97ms |
| total | 2.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0037ms | -0.0011ms | -30.31% |
| p50 | 0.0054ms | 0.0055ms | -0.000064ms | -1.18% |
| p95 | 0.02ms | 0.02ms | +0.0024ms | +15.33% |
| p99 | 0.02ms | 0.02ms | +0.0041ms | +19.70% |
| mean | 0.01ms | 0.01ms | -0.00099ms | -8.02% |
| min | 0.0025ms | 0.0026ms | -0.000055ms | -2.11% |
| max | 0.98ms | 1.09ms | -0.11ms | -10.29% |
| total | 2.27ms | 2.46ms | -0.20ms | -8.02% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0035ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0031ms |
| min | 0.0010ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0011ms | -0.000053ms | -4.68% |
| p50 | 0.0012ms | 0.0012ms | -0.000054ms | -4.43% |
| p95 | 0.0035ms | 0.0030ms | +0.00049ms | +16.36% |
| p99 | 0.02ms | 0.02ms | +0.0041ms | +23.57% |
| mean | 0.0018ms | 0.0018ms | -0.0000032ms | -0.17% |
| min | 0.0010ms | 0.0011ms | -0.000052ms | -4.82% |
| max | 0.03ms | 0.03ms | +0.00067ms | +2.58% |
| total | 0.37ms | 0.37ms | -0.00063ms | -0.17% |

