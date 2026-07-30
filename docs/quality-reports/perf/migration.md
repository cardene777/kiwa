# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00033ms | 0.0034ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diffSchema | 0.0010ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.00074ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +197%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| runUp | cpu | 0.08ms | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |
| diffSchema | cpu | 0.08ms | 0.09ms | 0.0010ms | 0.012 | 0.012 | 0.0010ms | 0.0010ms |
| clientCreate | cpu | 0.08ms | 0.09ms | 0.00017ms | 0.002 | 0.002 | 0.00016ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -11216 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -16312 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0034ms |
| p99 | 0.01ms |
| mean | 0.00092ms |
| stdev | 0.0018ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.029)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000096ms | +2.89% |
| p50 | 0.00039ms | 0.00042ms | -0.000031ms | -7.36% |
| p95 | 0.0035ms | 0.0031ms | +0.00037ms | +12.00% |
| p99 | 0.01ms | 0.0096ms | +0.00091ms | +9.52% |
| mean | 0.00095ms | 0.0010ms | -0.000059ms | -5.89% |
| min | 0.00034ms | 0.00033ms | +0.0000096ms | +2.89% |
| max | 0.02ms | 0.02ms | -0.0047ms | -22.42% |
| total | 0.19ms | 0.20ms | -0.01ms | -5.89% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0021ms |
| p99 | 0.0075ms |
| mean | 0.0014ms |
| stdev | 0.0019ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | +0.000031ms | +3.06% |
| p50 | 0.0011ms | 0.0011ms | -0.000011ms | -1.00% |
| p95 | 0.0020ms | 0.0031ms | -0.0010ms | -33.58% |
| p99 | 0.0074ms | 0.02ms | -0.01ms | -65.21% |
| mean | 0.0014ms | 0.0018ms | -0.00039ms | -21.82% |
| min | 0.00095ms | 0.00096ms | -0.0000095ms | -1.00% |
| max | 0.02ms | 0.02ms | -0.0042ms | -17.27% |
| total | 0.28ms | 0.36ms | -0.08ms | -21.82% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00074ms |
| p99 | 0.0062ms |
| mean | 0.00048ms |
| stdev | 0.0019ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000023ms | -1.40% |
| p50 | 0.00021ms | 0.00021ms | -0.0000029ms | -1.40% |
| p95 | 0.00073ms | 0.00060ms | +0.00012ms | +20.00% |
| p99 | 0.0061ms | 0.0040ms | +0.0021ms | +52.83% |
| mean | 0.00047ms | 0.00043ms | +0.000044ms | +10.25% |
| min | 0.00012ms | 0.00013ms | -0.0000017ms | -1.40% |
| max | 0.02ms | 0.02ms | +0.00016ms | +0.69% |
| total | 0.09ms | 0.09ms | +0.0087ms | +10.25% |

