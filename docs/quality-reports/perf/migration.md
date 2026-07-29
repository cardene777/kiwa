# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00038ms | 0.0025ms | 5ms | 0.00034ms | PASS | stable (p10 +1% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| diffSchema | 0.00096ms | 0.0020ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.00034ms | 5ms | 0.00037ms | PASS | stable (検知には +0.00037ms (baseline 比 +219%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| runUp | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00038ms | 0.00038ms |
| diffSchema | cpu | 0.08ms | 0.00096ms | 0.012 | 0.012 | 0.00098ms | 0.0010ms |
| clientCreate | cpu | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00018ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -14688 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -16296 B | 0 B | 102400 B | yes | PASS |
| clientCreate | -376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0025ms |
| p99 | 0.0071ms |
| mean | 0.00067ms |
| stdev | 0.0011ms |
| min | 0.00033ms |
| max | 0.0083ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | -5.0e-7ms | -0.12% |
| p95 | 0.0025ms | 0.0021ms | +0.00041ms | +19.25% |
| p99 | 0.0071ms | 0.0077ms | -0.00057ms | -7.35% |
| mean | 0.00067ms | 0.00073ms | -0.000056ms | -7.64% |
| min | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| max | 0.0083ms | 0.01ms | -0.0034ms | -29.03% |
| total | 0.13ms | 0.15ms | -0.01ms | -7.64% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0020ms |
| p99 | 0.0095ms |
| mean | 0.0014ms |
| stdev | 0.0018ms |
| min | 0.00092ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0010ms | -0.000041ms | -4.11% |
| p50 | 0.0010ms | 0.0011ms | -0.000042ms | -3.88% |
| p95 | 0.0020ms | 0.0032ms | -0.0012ms | -37.82% |
| p99 | 0.0095ms | 0.02ms | -0.0068ms | -41.58% |
| mean | 0.0014ms | 0.0016ms | -0.00028ms | -17.05% |
| min | 0.00092ms | 0.00092ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0044ms | -19.52% |
| total | 0.27ms | 0.33ms | -0.06ms | -17.05% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00019ms |
| p95 | 0.00034ms |
| p99 | 0.0035ms |
| mean | 0.00035ms |
| stdev | 0.0013ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -0.0000010ms | -0.60% |
| p50 | 0.00019ms | 0.00021ms | -0.000020ms | -9.86% |
| p95 | 0.00034ms | 0.0015ms | -0.0011ms | -76.97% |
| p99 | 0.0035ms | 0.0055ms | -0.0020ms | -35.82% |
| mean | 0.00035ms | 0.00053ms | -0.00017ms | -32.96% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0063ms | -26.34% |
| total | 0.07ms | 0.11ms | -0.03ms | -32.96% |

